"""Proactive write-proposer + pending-action approval queue.

Scans a section's records, proposes high-confidence field fixes via the
`propose_changes` capability, and stores each as a PENDING action. A human then
Approves (runs the normal update path) or Rejects them from the AI Inbox.
"""
import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord
from .gateway import run_capability, apply_capability

PENDING_ENTITY = "ai_pending_actions"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")
_LABEL_FIELDS = ["name", "title", "transaction_number", "reference", "code", "account_name",
                 "project_name", "task_name", "milestone_name"]
# Never let the proposer touch identifier/free-text fields, or use placeholder values.
_PLACEHOLDERS = {"", "required", "unknown", "tbd", "n/a", "na", "none", "null", "missing", "?"}
_PROTECTED_SUFFIX = ("_code", "_id", "_number")
_PROTECTED_FIELDS = {"name", "title", "description", "notes", "reference"}


def _is_safe_change(field: str, value) -> bool:
    if not field or value in (None, ""):
        return False
    if str(value).strip().lower() in _PLACEHOLDERS:
        return False
    if field in _PROTECTED_FIELDS or field.endswith(_PROTECTED_SUFFIX):
        return False
    return True


def _label(data: dict) -> str:
    for f in _LABEL_FIELDS:
        if data.get(f):
            return str(data[f])
    return next((str(v) for v in data.values() if v), "(record)")


async def run_proposer(db: AsyncSession, module_code: str, entity_type: str, scan: int = 25) -> dict:
    rows = list((await db.execute(
        select(EntityRecord)
        .where(EntityRecord.entity_type == entity_type, EntityRecord.is_deleted == "N")
        .order_by(EntityRecord.created_at.desc()).limit(scan))).scalars().all())
    if not rows:
        return {"proposed": 0}

    lines, idmap = [], {}
    for i, r in enumerate(rows, start=1):
        data = r.data or {}
        idmap[i] = {"id": str(r.id), "label": _label(data), "data": data}
        lines.append(f"[{i}] {idmap[i]['label']} :: {json.dumps(data, default=str)[:500]}")

    out = await run_capability(
        db, "propose_changes", module_code=module_code, entity_type=entity_type,
        context={"data": "\n".join(lines)}, enforce_gate=False, dry_run=True)
    proposals = ((out.get("result") or {}).get("proposals")) or []

    grouped: dict[int, dict] = {}
    for p in proposals:
        ref, field, value = p.get("reference"), p.get("field"), p.get("value")
        if ref not in idmap or not _is_safe_change(field, value):
            continue
        # Skip no-ops: the proposed value already equals the current one.
        current = idmap[ref]["data"].get(field)
        if str(current).strip().lower() == str(value).strip().lower():
            continue
        g = grouped.setdefault(ref, {"changes": {}, "reasons": []})
        g["changes"][field] = value
        if p.get("reason"):
            g["reasons"].append(f"{field}: {p['reason']}")

    n = 0
    for ref, g in grouped.items():
        if not g["changes"]:
            continue
        db.add(EntityRecord(
            entity_type=PENDING_ENTITY, module_code="core",
            data={"module_code": module_code, "entity_type": entity_type,
                  "record_id": idmap[ref]["id"], "label": idmap[ref]["label"],
                  "changes": g["changes"], "reason": "; ".join(g["reasons"]), "status": "pending"},
            organization_id=DEFAULT_ORG_ID, created_by=SYSTEM_USER_ID, last_modified_by=SYSTEM_USER_ID))
        n += 1
    await db.commit()
    return {"proposed": n}


async def list_pending(db: AsyncSession, limit: int = 50) -> list[dict]:
    rows = (await db.execute(
        select(EntityRecord)
        .where(EntityRecord.entity_type == PENDING_ENTITY, EntityRecord.is_deleted == "N")
        .order_by(EntityRecord.created_at.desc()).limit(limit))).scalars().all()
    return [{"id": str(r.id), "created_at": r.created_at.isoformat() if r.created_at else None, **(r.data or {})}
            for r in rows if (r.data or {}).get("status") == "pending"]


async def resolve_pending(db: AsyncSession, pending_id: str, approve: bool) -> dict:
    r = await db.get(EntityRecord, uuid.UUID(pending_id))
    if not r or r.entity_type != PENDING_ENTITY:
        return {"ok": False, "reason": "not found"}
    d = r.data or {}
    if d.get("status") != "pending":
        return {"ok": False, "reason": "already processed"}
    if approve:
        try:
            await apply_capability(
                db, "update_record", module_code=d["module_code"], entity_type=d["entity_type"],
                result={"record_id": d["record_id"], "changes": d["changes"]}, enforce_gate=False)
        except Exception as e:
            return {"ok": False, "reason": str(e)[:200]}
        r.data = {**d, "status": "approved"}
    else:
        r.data = {**d, "status": "rejected"}
    await db.commit()
    return {"ok": True, "status": r.data["status"]}
