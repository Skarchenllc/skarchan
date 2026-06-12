"""AI Workers — section specialists/managers.

A worker is a persona layered on top of the existing capabilities for a section
(e.g. an "AI Accountant" for accounting/invoices). It contributes a role +
persona to the system prompt and carries autonomy / KPIs. Capabilities it can
use are still gated by ai_settings; the worker just gives them a character.

Stored as entity_records of type 'ai_workers', one per (module_code, entity_type).
"""
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

WORKERS_ENTITY = "ai_workers"
SYSTEM_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
DEFAULT_ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def _all(db: AsyncSession) -> list[EntityRecord]:
    q = select(EntityRecord).where(EntityRecord.entity_type == WORKERS_ENTITY,
                                   EntityRecord.is_deleted == "N")
    return list((await db.execute(q)).scalars().all())


async def list_workers(db: AsyncSession, module_code: str | None = None) -> list[dict]:
    out = []
    for r in await _all(db):
        d = r.data or {}
        if module_code and d.get("module_code") != module_code:
            continue
        out.append({"id": str(r.id), **d})
    return out


async def _row_for(db: AsyncSession, module_code: str, entity_type: str) -> EntityRecord | None:
    for r in await _all(db):
        d = r.data or {}
        if d.get("module_code") == module_code and d.get("entity_type") == entity_type:
            return r
    return None


async def get_worker(db: AsyncSession, module_code: str, entity_type: str) -> dict | None:
    r = await _row_for(db, module_code, entity_type)
    if not r:
        return None
    d = r.data or {}
    return {"id": str(r.id), **d} if d.get("enabled") else None


async def upsert_worker(db: AsyncSession, payload: dict, actor: uuid.UUID | None = None) -> dict:
    actor = actor or SYSTEM_USER_ID
    module_code, entity_type = payload.get("module_code"), payload.get("entity_type")
    if not module_code or not entity_type:
        raise ValueError("module_code and entity_type are required")
    data = {
        "module_code": module_code,
        "entity_type": entity_type,
        "name": payload.get("name") or "AI Specialist",
        "role": payload.get("role") or "specialist",
        "persona": payload.get("persona") or "",
        "avatar": payload.get("avatar") or "",  # optional custom image URL (else generated from name)
        "autonomy": payload.get("autonomy") or "suggest",
        "model_tier": payload.get("model_tier"),
        "kpis": payload.get("kpis") or [],
        # Capability ids this worker owns. Empty = owns ALL capabilities for the
        # section (backward-compatible). When set, the worker's persona + baseline
        # autonomy apply only to these; other capabilities fall back to defaults.
        "capabilities": payload.get("capabilities") or [],
        "enabled": bool(payload.get("enabled", True)),
    }
    existing = await _row_for(db, module_code, entity_type)
    if existing:
        existing.data = data
        existing.last_modified_by = actor
        existing.last_modified_at = datetime.utcnow()
        await db.commit()
        await db.refresh(existing)
        return {"id": str(existing.id), **data}
    rec = EntityRecord(entity_type=WORKERS_ENTITY, module_code="core", data=data,
                       organization_id=DEFAULT_ORG_ID, created_by=actor, last_modified_by=actor)
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return {"id": str(rec.id), **data}


async def delete_worker(db: AsyncSession, worker_id: str) -> bool:
    r = await db.get(EntityRecord, uuid.UUID(worker_id))
    if not r or r.entity_type != WORKERS_ENTITY:
        return False
    r.is_deleted = "Y"
    r.deleted_at = datetime.utcnow()
    await db.commit()
    return True


def worker_owns(worker: dict | None, capability_id: str) -> bool:
    """True if this (enabled) worker is responsible for the given capability.
    A worker with no explicit capability list owns all of them."""
    if not worker:
        return False
    caps = worker.get("capabilities") or []
    return (not caps) or (capability_id in caps)


def persona_preamble(worker: dict) -> str:
    """The system-prompt prefix that puts a capability 'in character' as this worker."""
    bits = [f"You are {worker.get('name', 'an AI specialist')}, the {worker.get('role', 'specialist')} for this area of the business."]
    if worker.get("persona"):
        bits.append(worker["persona"])
    if worker.get("kpis"):
        bits.append("You care about these outcomes: " + "; ".join(worker["kpis"]) + ".")
    return " ".join(bits)
