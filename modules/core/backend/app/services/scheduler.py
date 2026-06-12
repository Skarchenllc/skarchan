"""
Durable scheduler primitives.

Two problems with a naive in-process loop: it loses its place on restart (tick
counters reset) and it double-runs if you scale to >1 instance. This fixes both:

  • `due(db, job, interval)` — time-based gating persisted in a `scheduler_state`
    record, so "run every N seconds" survives restarts.
  • `acquire_lock` / `release_lock` — a Postgres advisory lock so only ONE
    instance executes the jobs at a time; if the leader dies its connection drops,
    the lock frees, and another instance takes over on its next tick.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG = uuid.UUID("00000000-0000-0000-0000-000000000000")
LOCK_KEY = 947113  # arbitrary, stable app-wide key for the scheduler lock


async def _state(db: AsyncSession) -> EntityRecord:
    rec = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "scheduler_state", EntityRecord.is_deleted == "N")
    )).scalars().first()
    if rec is None:
        rec = EntityRecord(entity_type="scheduler_state", module_code="core", data={},
                           organization_id=ORG, created_by=SYS, last_modified_by=SYS)
        db.add(rec)
        await db.commit()
        await db.refresh(rec)
    return rec


async def due(db: AsyncSession, job: str, interval_seconds: float) -> bool:
    """True if `job` hasn't run within `interval_seconds`; records the run if so."""
    rec = await _state(db)
    data = dict(rec.data or {})
    now = datetime.utcnow()
    last = data.get(job)
    if last:
        try:
            if (now - datetime.fromisoformat(last)).total_seconds() < interval_seconds:
                return False
        except ValueError:
            pass
    data[job] = now.isoformat()
    rec.data = data
    rec.last_modified_at = now
    await db.commit()
    return True


async def acquire_lock(db: AsyncSession) -> bool:
    return bool((await db.execute(text("SELECT pg_try_advisory_lock(:k)").bindparams(k=LOCK_KEY))).scalar())


async def release_lock(db: AsyncSession) -> None:
    await db.execute(text("SELECT pg_advisory_unlock(:k)").bindparams(k=LOCK_KEY))
    await db.commit()
