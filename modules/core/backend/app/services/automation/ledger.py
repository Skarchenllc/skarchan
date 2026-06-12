"""Action ledger — a reversible, idempotent record of every side-effect the
automation/AI layer applies.

`automation_runs` is an audit *log* (what fired, succeeded/failed). The ledger is
different: it captures the **before/after state** of each concrete action so it
can be **undone**, and an **idempotency key** so the same action isn't applied
twice. Roadmap step #3, attached at the action boundary (engine `_execute` and
the AI job runner).

One `action_ledger` entity_record per applied action:

    action_type      : str   # set_field | create_activity | send_email | enroll_journey | ai_run | ai_write_back
    target_entity    : str   # the entity_type the action touched / created
    target_record_id : str   # the record changed (set_field) or created (create_*)
    before           : dict  # prior field values (set_field/write_back); None for creates
    after            : dict   # new field values / {"created": true}; None for deletes
    reversible       : bool
    reversed         : bool   # flipped by undo()
    source           : str    # automation rule name / ai job source
    idempotency_key  : str    # dedupe key (automation:record:action:field:value)
    run_at           : iso
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

LEDGER_ENTITY = "action_ledger"
SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")

# Actions that create a brand-new record — undo = soft-delete that record.
_CREATE_ACTIONS = {"create_activity", "send_email", "enroll_journey", "ai_run"}


def idempotency_key(automation_id, record_id, action_type, action_field, action_value) -> str:
    return f"{automation_id}:{record_id}:{action_type}:{action_field or ''}:{action_value or ''}"


async def already_applied(db: AsyncSession, key: str) -> bool:
    """True if a non-reversed ledger entry with this idempotency key exists."""
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == LEDGER_ENTITY,
            EntityRecord.is_deleted == "N",
        )
    )
    for r in res.scalars().all():
        d = r.data or {}
        if d.get("idempotency_key") == key and not d.get("reversed"):
            return True
    return False


async def record(db: AsyncSession, *, action_type: str, target_entity: str,
                 target_record_id, before: Optional[dict], after: Optional[dict],
                 reversible: bool, source: Optional[str], org_id,
                 idempotency_key: Optional[str] = None, detail: str = "") -> EntityRecord:
    """Append one ledger entry. The caller has already performed the action."""
    rec = EntityRecord(
        entity_type=LEDGER_ENTITY, module_code="automation",
        data={
            "name": f"{source or 'action'} · {action_type} → {target_entity}",
            "action_type": action_type,
            "target_entity": target_entity,
            "target_record_id": str(target_record_id) if target_record_id else None,
            "before": before,
            "after": after,
            "reversible": bool(reversible),
            "reversed": False,
            "source": source,
            "idempotency_key": idempotency_key,
            "detail": detail,
            "run_at": datetime.utcnow().isoformat(),
        },
        organization_id=org_id, created_by=SYS_USER, last_modified_by=SYS_USER,
    )
    db.add(rec)
    return rec


async def undo(db: AsyncSession, ledger_id: str) -> dict:
    """Reverse a single ledger entry. Returns {ok, detail} or {error}."""
    try:
        lid = uuid.UUID(str(ledger_id))
    except (ValueError, TypeError):
        return {"error": "invalid ledger id"}
    entry = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == lid)
    )).scalar_one_or_none()
    if entry is None or entry.entity_type != LEDGER_ENTITY:
        return {"error": "ledger entry not found"}
    d = entry.data or {}
    if d.get("reversed"):
        return {"error": "already reversed"}
    if not d.get("reversible"):
        return {"error": "not reversible"}

    action_type = d.get("action_type")
    target_id = d.get("target_record_id")
    detail = ""

    target = None
    if target_id:
        try:
            target = (await db.execute(
                select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(target_id)))
            )).scalar_one_or_none()
        except (ValueError, TypeError):
            target = None

    if action_type in _CREATE_ACTIONS:
        # Undo a create → soft-delete the created record.
        if target is None:
            detail = "created record already gone"
        else:
            target.is_deleted = "Y"
            target.last_modified_by = SYS_USER
            target.last_modified_at = datetime.utcnow()
            detail = f"soft-deleted {d.get('target_entity')}:{target_id}"
    else:
        # Undo a field change (set_field / ai_write_back) → restore `before`.
        before = d.get("before") or {}
        if target is None:
            detail = "target record not found; nothing restored"
        else:
            target.data = {**(target.data or {}), **before}
            target.last_modified_by = SYS_USER
            target.last_modified_at = datetime.utcnow()
            detail = f"restored {list(before.keys())} on {d.get('target_entity')}:{target_id}"

    entry.data = {**d, "reversed": True, "reversed_at": datetime.utcnow().isoformat(),
                  "undo_detail": detail}
    entry.last_modified_by = SYS_USER
    entry.last_modified_at = datetime.utcnow()
    await db.commit()
    return {"ok": True, "detail": detail, "action_type": action_type}


async def list_entries(db: AsyncSession, limit: int = 100, include_reversed: bool = True) -> list[dict]:
    q = (select(EntityRecord)
         .where(EntityRecord.entity_type == LEDGER_ENTITY, EntityRecord.is_deleted == "N")
         .order_by(EntityRecord.created_at.desc()).limit(limit))
    out = []
    for r in (await db.execute(q)).scalars().all():
        d = r.data or {}
        if not include_reversed and d.get("reversed"):
            continue
        out.append({"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else None, **d})
    return out
