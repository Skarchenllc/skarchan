"""Proactive runner — runs `mode='proactive'` capabilities on a schedule.

For every section that has AI enabled, run its enabled proactive capabilities
(e.g. risk_scan) and persist the result as an `ai_insights` record. Honors the
section toggles and the global governance guard (master switch + budget) via
the gateway. Triggered by the background scheduler or POST /api/v1/ai/proactive/run.
"""
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from . import settings as ai_settings, manager as ai_manager, notify as ai_notify, proposer as ai_proposer
from .capabilities import CAPABILITIES
from .gateway import run_capability

INSIGHTS_ENTITY = "ai_insights"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


def _proactive_caps_for(entity_type: str):
    return [c for c in CAPABILITIES.values()
            if c.mode == "proactive" and ("*" in c.applies_to or entity_type in c.applies_to)]


async def run_proactive(db: AsyncSession, only_module: str | None = None,
                        include_manager: bool = True, include_proposer: bool = True) -> dict:
    rows = await ai_settings.list_settings(db, only_module)
    ran, skipped, errors = 0, 0, 0
    insights: list[dict] = []
    briefings: list[dict] = []
    proposed = 0
    total_cost = 0.0

    for s in rows:
        if s.get("module_code") == ai_settings.GLOBAL_MODULE or not s.get("enabled"):
            continue
        module_code, entity_type = s.get("module_code"), s.get("entity_type")
        for cap in _proactive_caps_for(entity_type):
            if not await ai_settings.is_capability_enabled(db, module_code, entity_type, cap.id):
                skipped += 1
                continue
            try:
                out = await run_capability(
                    db, cap.id, module_code=module_code, entity_type=entity_type,
                    context={"question": "Scan for the most important risks and issues."},
                    enforce_gate=True,
                )
            except Exception as e:  # governance/budget/API — stop cleanly on budget, else skip
                errors += 1
                if "budget" in str(e).lower():
                    return _summary(ran, skipped, errors, insights, total_cost, halted="budget")
                continue

            result = out.get("result") or {}
            findings = result.get("findings") or []
            rec = EntityRecord(
                entity_type=INSIGHTS_ENTITY, module_code="core",
                data={
                    "module_code": module_code,
                    "entity_type": entity_type,
                    "capability_id": cap.id,
                    "summary": result.get("summary", ""),
                    "findings": findings,
                    "citations": out.get("citations", []),
                    "severity_max": _max_sev(findings),
                },
                organization_id=DEFAULT_ORG_ID, created_by=SYSTEM_USER_ID, last_modified_by=SYSTEM_USER_ID,
            )
            db.add(rec)
            await db.commit()
            await db.refresh(rec)
            ran += 1
            total_cost += float(out.get("usage", {}).get("cost_usd") or 0)
            insights.append({"id": str(rec.id), "module_code": module_code, "entity_type": entity_type,
                             "capability_id": cap.id, "findings": len(findings),
                             "severity_max": rec.data["severity_max"]})
            # Push high-severity risk scans to the Notifications inbox.
            if findings and rec.data["severity_max"] == "high":
                try:
                    await ai_notify.notify_users(
                        db, title=f"⚠️ High risk in {module_code}/{entity_type}",
                        message=rec.data.get("summary", ""), category="warning", priority="high",
                        module_name=module_code, group="ai-risk")
                except Exception:
                    pass

    # Write-proposer: scan each enabled section and queue high-confidence fixes
    # for human approval in the Inbox.
    if include_proposer:
        for s in rows:
            if s.get("module_code") == ai_settings.GLOBAL_MODULE or not s.get("enabled"):
                continue
            try:
                res = await ai_proposer.run_proposer(db, s["module_code"], s["entity_type"])
                proposed += int(res.get("proposed") or 0)
            except Exception as e:
                errors += 1
                if "budget" in str(e).lower():
                    return _summary(ran, skipped, errors, insights, total_cost, halted="budget",
                                    briefings=briefings, proposed=proposed)
                continue
        if proposed:
            try:
                await ai_notify.notify_users(
                    db, title=f"📝 {proposed} AI change{'s' if proposed != 1 else ''} awaiting approval",
                    message="The AI proposed record fixes for your review.", category="approval",
                    priority="normal", resource_url="/nexacore/ai", group="ai-proposal")
            except Exception:
                pass

    # Per-module manager briefings: each module with AI-enabled sections gets a
    # synthesized briefing (delegates to its specialists). Budget-aware.
    if include_manager:
        modules = sorted({s["module_code"] for s in rows
                          if s.get("enabled") and s.get("module_code") != ai_settings.GLOBAL_MODULE})
        for mc in modules:
            try:
                res = await ai_manager.run_manager(db, mc)
            except Exception as e:
                errors += 1
                if "budget" in str(e).lower():
                    return _summary(ran, skipped, errors, insights, total_cost, halted="budget", briefings=briefings, proposed=proposed)
                continue
            if res.get("brief"):
                b = res["brief"]
                briefings.append({"module_code": mc, "insight_id": res.get("insight_id"),
                                  "priorities": len(b.get("priorities", [])), "risks": len(b.get("risks", []))})
                total_cost += float(res.get("cost_usd") or 0)
                try:
                    await ai_notify.notify_users(
                        db, title=f"🧭 {mc} manager briefing", message=b.get("summary", ""),
                        category="info", priority="normal", module_name=mc, group="ai-briefing")
                except Exception:
                    pass

    return _summary(ran, skipped, errors, insights, total_cost, briefings=briefings, proposed=proposed)


_SEV_ORDER = {"low": 1, "medium": 2, "high": 3}


def _max_sev(findings: list[dict]) -> str | None:
    sev = [f.get("severity") for f in findings if f.get("severity")]
    return max(sev, key=lambda s: _SEV_ORDER.get(s, 0)) if sev else None


def _summary(ran, skipped, errors, insights, cost, halted=None, briefings=None, proposed=0):
    return {"ran": ran, "skipped": skipped, "errors": errors,
            "insights": insights, "briefings": briefings or [], "proposed": proposed,
            "cost_usd": round(cost, 6), "halted": halted}


async def list_insights(db: AsyncSession, limit: int = 50, include_acknowledged: bool = True) -> list[dict]:
    from sqlalchemy import select
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == INSIGHTS_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()).limit(limit))
    rows = (await db.execute(q)).scalars().all()
    out = []
    for r in rows:
        d = r.data or {}
        if not include_acknowledged and d.get("acknowledged"):
            continue
        out.append({"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else None, **d})
    return out


async def acknowledge_insight(db: AsyncSession, insight_id: str) -> bool:
    r = await db.get(EntityRecord, uuid.UUID(insight_id))
    if not r or r.entity_type != INSIGHTS_ENTITY:
        return False
    r.data = {**(r.data or {}), "acknowledged": True}
    await db.commit()
    return True
