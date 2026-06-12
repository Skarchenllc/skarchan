"""AI job runner — drains the `ai_jobs` queue enqueued by automation rules.

The automation engine's `ai_run` action does not call Claude inline (that would
block the originating create/update on a multi-second API call). Instead it
enqueues an `ai_jobs` record (status `Queued`). This runner processes that queue
out-of-band: for each job it runs the named capability on the triggering record
*through the gateway* — so the section toggle and the global budget/kill-switch
still apply — writes the textual result back onto the record's `target_field`,
and marks the job `Done` / `Failed`.

Triggered by the automation scheduler tick (when AI_JOBS_ENABLED=true) or
manually via POST /api/v1/automation/ai-jobs/run. Mirrors the marketing
`process_email_queue` enqueue-then-runner pattern.
"""
from __future__ import annotations

import json
import uuid
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_MAX_ATTEMPTS = 3

# Internal / bookkeeping keys that shouldn't be fed to the model as record content.
_SKIP_KEYS = {"_id", "id", "created_by", "last_modified_by", "organization_id", "is_deleted"}


def _classify_error(msg: str) -> str:
    """budget | permanent | transient — decides whether a failed job retries."""
    m = (msg or "").lower()
    if "budget" in m:
        return "budget"   # leave Queued; resumes when budget frees / is raised
    if any(s in m for s in ("not enabled", "globally disabled", "unknown capability",
                            "record not found", "not configured", "not registered")):
        return "permanent"  # config/data problem — retrying won't help
    return "transient"      # API 5xx, timeouts, malformed output — worth retrying


def _backoff_seconds(attempts: int) -> int:
    """Exponential backoff (capped): 1st retry ~2m, then 4m, 8m, … max 30m."""
    return min(120 * (2 ** max(0, attempts - 1)), 1800)


def _due(d: dict, now: datetime) -> bool:
    """A Queued job is due unless a future next_attempt_at says otherwise."""
    nra = d.get("next_attempt_at")
    if not nra:
        return True
    try:
        return datetime.fromisoformat(nra) <= now
    except (ValueError, TypeError):
        return True


def _record_text(data: dict) -> str:
    """Render a record's data as readable `key: value` lines for the model."""
    parts = []
    for k, v in (data or {}).items():
        if k in _SKIP_KEYS or v in (None, "", [], {}):
            continue
        parts.append(f"{k}: {v}")
    return "\n".join(parts) or "(empty record)"


def _result_text(out: dict) -> str:
    """Pull a single text payload out of a gateway result, whatever its shape."""
    res = (out or {}).get("result") or {}
    if isinstance(res, dict):
        if isinstance(res.get("text"), str):
            return res["text"]
        if isinstance(res.get("summary"), str):
            return res["summary"]
        return json.dumps(res, ensure_ascii=False)
    return str(res)


async def process_ai_jobs(db: AsyncSession, limit: int = 100) -> dict:
    """One drain of the AI job queue. Each job runs, writes back, and self-records.

    Budget exhaustion stops the drain for this tick (the queue resumes next tick);
    any other error fails just that one job and the runner moves on.
    """
    # Lazy import so the gateway (and `anthropic`) isn't pulled in at startup/import.
    from app.services.ai.gateway import run_capability, apply_capability
    from app.services.ai import policy

    mode = await policy.global_mode(db)  # global routing override, read once per drain

    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "ai_jobs",
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )
    processed = review = blocked = failed = retried = 0
    total_cost = 0.0
    now = datetime.utcnow()

    for job in res.scalars().all():
        d = job.data or {}
        if d.get("status") != "Queued":
            continue
        if not _due(d, now):
            continue  # backing off after a transient failure — not due yet
        cap = d.get("capability") or "summarize"
        module_code = d.get("module_code") or "core"
        entity_type = d.get("entity_type")
        record_id = d.get("record_id")
        target_field = d.get("target_field")
        is_action = cap in policy.ACTION_CAPS

        # Load the record the automation fired on.
        record = None
        if record_id:
            try:
                record = (await db.execute(
                    select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(record_id)))
                )).scalar_one_or_none()
            except (ValueError, TypeError):
                record = None
        if record is None:
            job.data = {**d, "status": "Failed", "error": "trigger record not found",
                        "ran_at": datetime.utcnow().isoformat()}
            await db.commit()
            failed += 1
            continue

        rdata = record.data or {}
        rtext = _record_text(rdata)
        ctx = {"current_record": rdata, "input": rtext, "text": rtext}
        try:
            # is_action capabilities are run as a DRAFT (dry_run) so the policy can
            # gate them BEFORE anything persists; read/write-back caps run normally.
            out = await run_capability(
                db, cap, module_code=module_code, entity_type=entity_type,
                context=ctx, org_raw=str(record.organization_id),
                enforce_gate=True, dry_run=is_action,
            )
        except Exception as e:
            # HTTPException carries .detail (gate / budget / API messages); else str.
            msg = str(getattr(e, "detail", None) or e)
            kind = _classify_error(msg)
            if kind == "budget":
                # Don't fail the job — leave it Queued and stop draining this tick.
                break
            attempts = int(d.get("attempts") or 0) + 1
            max_attempts = int(d.get("max_attempts") or DEFAULT_MAX_ATTEMPTS)
            if kind == "transient" and attempts < max_attempts:
                # Requeue with exponential backoff; durable across restarts (DB-backed).
                nxt = now + timedelta(seconds=_backoff_seconds(attempts))
                job.data = {**d, "status": "Queued", "attempts": attempts,
                            "max_attempts": max_attempts, "error": msg[:500],
                            "next_attempt_at": nxt.isoformat(),
                            "last_attempt_at": now.isoformat()}
                retried += 1
            else:
                job.data = {**d, "status": "Failed", "attempts": attempts,
                            "max_attempts": max_attempts, "error": msg[:500],
                            "ran_at": now.isoformat()}
                failed += 1
            await db.commit()
            continue

        text = _result_text(out)
        cost = float((out.get("usage") or {}).get("cost_usd") or 0)
        total_cost += cost

        # Confidence × risk routing. Read-only jobs (no field write, no record
        # creation) carry no action to gate — they're always Done (informational).
        autonomy = out.get("autonomy") or "suggest"
        risk = policy.risk_of(cap, has_write=bool(target_field))
        decision, reason = policy.decide(autonomy, risk, mode)
        has_action = bool(target_field) or is_action

        base = {**d, "result": text, "cost_usd": round(cost, 6),
                "run_id": out.get("run_id"), "model": out.get("model"),
                "autonomy": autonomy, "risk": risk, "decision": decision,
                "decision_reason": reason, "ran_at": datetime.utcnow().isoformat()}

        if not has_action:
            job.data = {**base, "status": "Done"}
            processed += 1
        elif decision == "block":
            job.data = {**base, "status": "Blocked"}
            blocked += 1
        elif decision == "review":
            # Park the proposal for human approval — nothing is applied yet.
            extra = {"proposed_draft": out.get("result")} if is_action else {"proposed_value": text}
            job.data = {**base, "status": "Pending Review", **extra}
            review += 1
        else:  # auto — apply now
            if is_action:
                await apply_capability(db, cap, module_code=module_code, entity_type=entity_type,
                                       result=out.get("result") or {}, context=ctx,
                                       org_raw=str(record.organization_id), enforce_gate=False)
            elif target_field:
                await _write_back(db, record, target_field, text, cap, d.get("source_automation"))
            job.data = {**base, "status": "Done", "applied": True}
            processed += 1

        await db.commit()

    return {"processed": processed, "review": review, "blocked": blocked,
            "retried": retried, "failed": failed, "cost_usd": round(total_cost, 6)}


async def _write_back(db, record, target_field, text, cap, source) -> None:
    """Write the AI result onto a record's field + ledger it (undoable). Direct
    write (no fire_event) so an `ai_run` rule can't re-trigger itself into a loop."""
    from app.services.automation import ledger as action_ledger
    rdata = record.data or {}
    before = {target_field: rdata.get(target_field)}
    record.data = {**rdata, target_field: text}
    record.last_modified_by = SYS_USER
    record.last_modified_at = datetime.utcnow()
    await action_ledger.record(
        db, action_type="ai_write_back", target_entity=record.entity_type,
        target_record_id=record.id, before=before, after={target_field: text},
        reversible=True, source=source or f"ai:{cap}",
        org_id=record.organization_id, detail=f"{cap} → {target_field}")


async def approve_job(db: AsyncSession, job_id: str) -> dict:
    """Apply a Pending Review job: write back the value, or apply the drafted record."""
    from app.services.ai.gateway import apply_capability
    try:
        job = (await db.execute(
            select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(job_id)))
        )).scalar_one_or_none()
    except (ValueError, TypeError):
        return {"error": "invalid job id"}
    if job is None or job.entity_type != "ai_jobs":
        return {"error": "job not found"}
    d = job.data or {}
    if d.get("status") != "Pending Review":
        return {"error": f"job is {d.get('status')}, not Pending Review"}

    cap = d.get("capability") or "summarize"
    if d.get("proposed_draft") is not None:
        record = await _load(db, d.get("record_id"))
        ctx = {"current_record": (record.data if record else {}),
               "record_id": d.get("record_id")}
        await apply_capability(db, cap, module_code=d.get("module_code") or "core",
                               entity_type=d.get("entity_type"), result=d["proposed_draft"],
                               context=ctx, enforce_gate=False)
        detail = f"applied {cap} draft"
    else:
        record = await _load(db, d.get("record_id"))
        if record is None:
            return {"error": "trigger record not found"}
        await _write_back(db, record, d.get("target_field"), d.get("proposed_value"),
                          cap, d.get("source_automation"))
        detail = f"wrote {d.get('target_field')}"
    job.data = {**d, "status": "Done", "applied": True, "approved": True,
                "approved_at": datetime.utcnow().isoformat()}
    await db.commit()
    return {"ok": True, "detail": detail}


async def reject_job(db: AsyncSession, job_id: str) -> dict:
    """Discard a Pending Review job without applying it."""
    try:
        job = (await db.execute(
            select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(job_id)))
        )).scalar_one_or_none()
    except (ValueError, TypeError):
        return {"error": "invalid job id"}
    if job is None or job.entity_type != "ai_jobs":
        return {"error": "job not found"}
    d = job.data or {}
    if d.get("status") != "Pending Review":
        return {"error": f"job is {d.get('status')}, not Pending Review"}
    job.data = {**d, "status": "Rejected", "rejected_at": datetime.utcnow().isoformat()}
    await db.commit()
    return {"ok": True}


async def _load(db: AsyncSession, record_id):
    if not record_id:
        return None
    try:
        return (await db.execute(
            select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(record_id)))
        )).scalar_one_or_none()
    except (ValueError, TypeError):
        return None
