"""
Email suppression — the do-not-send list. Unsubscribes and bounces land here, and
every send path checks it first so we never email a suppressed address again.
"""
from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS = uuid.UUID("00000000-0000-0000-0000-000000000001")
ORG = uuid.UUID("00000000-0000-0000-0000-000000000000")


async def is_suppressed(db: AsyncSession, email: str | None) -> bool:
    if not email:
        return False
    return (await db.execute(
        select(EntityRecord.id).where(
            EntityRecord.entity_type == "suppressions", EntityRecord.is_deleted == "N",
        ).where(text("lower(data->>'email') = :e")).params(e=email.lower())
    )).first() is not None


async def suppress(db: AsyncSession, email: str | None, reason: str = "unsubscribe") -> bool:
    """Add an address to the suppression list (idempotent). Returns True if newly added."""
    if not email:
        return False
    if await is_suppressed(db, email):
        return False
    db.add(EntityRecord(
        entity_type="suppressions", module_code="marketing",
        data={"name": email, "email": email.lower(), "reason": reason,
              "suppressed_at": datetime.utcnow().isoformat()},
        organization_id=ORG, created_by=SYS, last_modified_by=SYS,
    ))
    # also flag the matching lead, if any
    lead = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "leads", EntityRecord.is_deleted == "N",
        ).where(text("lower(data->>'email') = :e")).params(e=email.lower())
    )).scalars().first()
    if lead is not None:
        lead.data = {**(lead.data or {}), "email_opt_out": True}
        lead.last_modified_at = datetime.utcnow()
    await db.commit()
    return True
