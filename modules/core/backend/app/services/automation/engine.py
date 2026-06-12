"""
Automation engine — shared by Sales, Marketing and any other module.

A rule (entity_type `automations`) has the shape:

    trigger_entity : str   # e.g. 'opportunities'  (entity_type the rule watches)
    trigger_event  : str   # created | updated | field_changed
    condition_field: str   # optional; field in the record's data to test
    condition_op   : str   # equals | not_equals | greater_than | less_than | contains | changed | is_empty
    condition_value: str   # value to compare against
    action_type    : str   # set_field | create_activity | send_email | enroll_journey | ai_run | log
    action_field   : str   # for set_field: which field to write; for ai_run: field to write the AI result into
    action_value   : str   # value / subject / template / journey name; for ai_run: the AI capability id
    status         : str   # Active | Paused

The `ai_run` action does NOT call Claude inline (that would block the originating
write on a multi-second API call). It enqueues an `ai_jobs` record which the AI
job runner (app.services.ai.jobs) drains out-of-band — the same enqueue-then-runner
pattern used by `send_email` → the marketing email queue.

Execution is intentionally side-effect-safe: the engine writes directly to the
DB (never back through the API) so it cannot re-trigger itself, and every rule
is wrapped so a bad rule can never break the originating request. Every run is
recorded as an `automation_runs` record for an auditable history.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from . import ledger

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")

TRIGGER_EVENTS = ["created", "updated", "field_changed", "deleted"]
CONDITION_OPS = ["equals", "not_equals", "greater_than", "less_than", "contains", "changed", "is_empty"]
ACTION_TYPES = ["set_field", "create_activity", "send_email", "enroll_journey", "ai_run", "log"]


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _evaluate(cfg: dict, data: dict, prev: Optional[dict]) -> bool:
    """Return True if the rule's condition passes for this record."""
    field = (cfg.get("condition_field") or "").strip()
    if not field:
        return True  # no condition → always fire
    op = cfg.get("condition_op") or "equals"
    actual = data.get(field)
    target = cfg.get("condition_value")

    if op == "changed":
        return (prev or {}).get(field) != actual
    if op == "is_empty":
        return actual in (None, "", [], {})
    if op == "equals":
        return str(actual) == str(target)
    if op == "not_equals":
        return str(actual) != str(target)
    if op == "contains":
        return target is not None and str(target).lower() in str(actual or "").lower()
    if op in ("greater_than", "less_than"):
        a, t = _num(actual), _num(target)
        if a is None or t is None:
            return False
        return a > t if op == "greater_than" else a < t
    return False


async def _log_run(db, cfg_rec, entity_type, record_id, status, action_type, detail, org_id):
    db.add(EntityRecord(
        entity_type="automation_runs",
        module_code="automation",
        data={
            "name": f"{cfg_rec.data.get('name', 'Automation')} → {action_type}",
            "automation_id": str(cfg_rec.id),
            "automation_name": cfg_rec.data.get("name"),
            "trigger_entity": entity_type,
            "record_id": str(record_id) if record_id else None,
            "action_type": action_type,
            "status": status,
            "detail": detail,
            "run_at": datetime.utcnow().isoformat(),
        },
        organization_id=org_id,
        created_by=SYS_USER,
        last_modified_by=SYS_USER,
    ))


def _truthy(v) -> bool:
    return str(v).strip().lower() in ("true", "yes", "1", "on", "active")


async def _execute(db, cfg_rec, entity_type, record, org_id) -> tuple[str, str]:
    """Run a single rule's action. Returns (status, detail). Never raises.

    Every applied action is written to the action ledger (before/after) so it can
    be undone; `set_field` is naturally idempotent (skips a no-op rewrite) and any
    action can opt into ledger-based dedupe via the rule's `idempotent` flag.
    """
    cfg = cfg_rec.data
    action = cfg.get("action_type") or "log"
    rid = record.id
    rdata = record.data or {}
    name = cfg.get("name")
    a_field, a_value = cfg.get("action_field"), cfg.get("action_value")
    key = ledger.idempotency_key(cfg_rec.id, rid, action, a_field, a_value)

    # Opt-in dedupe: if this rule is marked idempotent and the exact same action
    # already landed (and wasn't undone), skip it.
    if _truthy(cfg.get("idempotent")) and await ledger.already_applied(db, key):
        return "skipped", "idempotent: identical action already applied"

    if action == "set_field":
        if not a_field:
            return "failed", "set_field: no action_field configured"
        old = rdata.get(a_field)
        if str(old) == str(a_value):
            return "skipped", f"idempotent: {a_field} already = {a_value}"
        record.data = {**rdata, a_field: a_value}
        record.last_modified_by = SYS_USER
        record.last_modified_at = datetime.utcnow()
        await ledger.record(db, action_type=action, target_entity=entity_type,
                            target_record_id=rid, before={a_field: old}, after={a_field: a_value},
                            reversible=True, source=name, org_id=org_id,
                            idempotency_key=key, detail=f"set {a_field} = {a_value}")
        return "success", f"set {a_field} = {a_value}"

    if action == "create_activity":
        new = EntityRecord(
            entity_type="activities", module_code="sales",
            data={
                "subject": a_value or "Follow up",
                "type": "Task", "status": "Open", "priority": "Medium",
                "related_to": rdata.get("name") or rdata.get("subject") or str(rid),
                "source_automation": name,
            },
            organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
        )
        db.add(new)
        await db.flush()  # get the new id for the ledger
        await ledger.record(db, action_type=action, target_entity="activities",
                            target_record_id=new.id, before=None, after={"created": True},
                            reversible=True, source=name, org_id=org_id,
                            idempotency_key=key, detail=f"created activity '{a_value or 'Follow up'}'")
        return "success", f"created activity '{a_value or 'Follow up'}'"

    if action == "send_email":
        # Enqueue an email_send; the marketing email runner delivers it.
        new = EntityRecord(
            entity_type="email_sends", module_code="marketing",
            data={
                "name": f"{a_value or 'Email'} → {rdata.get('email') or rdata.get('name') or rid}",
                "template_name": a_value,
                "to_email": rdata.get("email"),
                "to_name": rdata.get("name") or rdata.get("first_name"),
                "status": "Queued",
                "source_automation": name,
            },
            organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
        )
        db.add(new)
        await db.flush()
        await ledger.record(db, action_type=action, target_entity="email_sends",
                            target_record_id=new.id, before=None, after={"created": True},
                            reversible=True, source=name, org_id=org_id,
                            idempotency_key=key, detail=f"queued email '{a_value}'")
        return "success", f"queued email '{a_value}' to {rdata.get('email') or 'contact'}"

    if action == "enroll_journey":
        new = EntityRecord(
            entity_type="journey_enrollments", module_code="marketing",
            data={
                "name": f"{a_value} · {rdata.get('name') or rdata.get('email') or rid}",
                "journey_name": a_value,
                "subject_id": str(rid),
                "subject_email": rdata.get("email"),
                "subject_name": rdata.get("name") or rdata.get("first_name"),
                "status": "Active",
                "current_step": 0,
                "enrolled_at": datetime.utcnow().isoformat(),
                "next_run_at": datetime.utcnow().isoformat(),
                "source_automation": name,
            },
            organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
        )
        db.add(new)
        await db.flush()
        await ledger.record(db, action_type=action, target_entity="journey_enrollments",
                            target_record_id=new.id, before=None, after={"created": True},
                            reversible=True, source=name, org_id=org_id,
                            idempotency_key=key, detail=f"enrolled in journey '{a_value}'")
        return "success", f"enrolled in journey '{a_value}'"

    if action == "ai_run":
        # Enqueue an AI job; the AI job runner calls the capability out-of-band so
        # the originating write is never blocked on a Claude call. action_value is
        # the capability id; action_field (optional) is where to write the result.
        capability = a_value or "summarize"
        new = EntityRecord(
            entity_type="ai_jobs", module_code="automation",
            data={
                "name": f"AI {capability} → {rdata.get('name') or rdata.get('subject') or rid}",
                "capability": capability,
                "module_code": record.module_code or "core",
                "entity_type": entity_type,
                "record_id": str(rid),
                "target_field": a_field,
                "status": "Queued",
                "source_automation": name,
                "queued_at": datetime.utcnow().isoformat(),
            },
            organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
        )
        db.add(new)
        await db.flush()
        await ledger.record(db, action_type=action, target_entity="ai_jobs",
                            target_record_id=new.id, before=None, after={"created": True},
                            reversible=True, source=name, org_id=org_id,
                            idempotency_key=key, detail=f"queued AI '{capability}'")
        tgt = f" → {a_field}" if a_field else ""
        return "success", f"queued AI '{capability}'{tgt}"

    # log (default)
    return "success", f"matched (no-op log) for {entity_type}:{rid}"


async def _matching_rules(db: AsyncSession, entity_type: str, event: str):
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "automations",
            EntityRecord.is_deleted == "N",
        )
    )
    rules = []
    for r in res.scalars().all():
        c = r.data or {}
        if (c.get("status") or "Active") != "Active":
            continue
        if c.get("trigger_entity") != entity_type:
            continue
        te = c.get("trigger_event") or "updated"
        # 'field_changed' rules also respond to updates
        if te == event or (te == "field_changed" and event == "updated"):
            rules.append(r)
    return rules


async def fire_event(
    db: AsyncSession,
    event: str,
    entity_type: str,
    record_id,
    data: dict,
    prev_data: Optional[dict] = None,
) -> None:
    """
    Called by the entity-record create/update endpoints. Evaluates every active
    rule watching this entity + event and runs the ones whose condition passes.
    Fully defensive — never raises into the caller.
    """
    try:
        rules = await _matching_rules(db, entity_type, event)
        if not rules:
            return
        rec_res = await db.execute(select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(record_id))))
        record = rec_res.scalar_one_or_none()
        if record is None:
            return
        org_id = record.organization_id
        for rule in rules:
            try:
                if not _evaluate(rule.data or {}, data, prev_data):
                    continue
                status, detail = await _execute(db, rule, entity_type, record, org_id)
                await _log_run(db, rule, entity_type, record_id, status, rule.data.get("action_type", "log"), detail, org_id)
            except Exception as e:  # one bad rule must not break others
                await _log_run(db, rule, entity_type, record_id, "failed", rule.data.get("action_type", "log"), f"error: {e}", org_id)
        await db.commit()
    except Exception:
        # Engine failures must never break the originating write.
        await db.rollback()


async def run_automation(db: AsyncSession, automation_id: str, limit: int = 500) -> dict:
    """
    Manually apply one rule to ALL existing records of its trigger_entity whose
    condition passes (e.g. apply-to-existing, or scheduled batch runs).
    """
    rule = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == uuid.UUID(automation_id))
    )).scalar_one_or_none()
    if rule is None or rule.entity_type != "automations":
        return {"error": "automation not found"}
    cfg = rule.data or {}
    target_entity = cfg.get("trigger_entity")
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == target_entity,
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )
    matched = executed = 0
    for rec in res.scalars().all():
        if not _evaluate(cfg, rec.data or {}, None):
            continue
        matched += 1
        try:
            status, detail = await _execute(db, rule, target_entity, rec, rec.organization_id)
            await _log_run(db, rule, target_entity, rec.id, status, cfg.get("action_type", "log"), detail, rec.organization_id)
            executed += 1
        except Exception as e:
            await _log_run(db, rule, target_entity, rec.id, "failed", cfg.get("action_type", "log"), f"error: {e}", rec.organization_id)
    await db.commit()
    return {"automation": cfg.get("name"), "trigger_entity": target_entity, "matched": matched, "executed": executed}
