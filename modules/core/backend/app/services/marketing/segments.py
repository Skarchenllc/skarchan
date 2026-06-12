"""
Dynamic segment engine — turns a segment's text `criteria` into live membership
and (optionally) auto-enrolls matching leads into a journey.

Criteria is one rule per line (all must match, AND), each `field OP value`:
    grade = Hot
    score > 50
    status = Qualified
    source ~ Website        (~ = contains)
Ops: =, !=, >, <, >=, <=, ~
"""
from __future__ import annotations

import re
import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")
_COND = re.compile(r"^\s*([\w.]+)\s*(>=|<=|!=|=|>|<|~)\s*(.+?)\s*$")


def parse_criteria(raw: str | None) -> list[tuple]:
    out = []
    for line in re.split(r"[\n;]+", raw or ""):
        m = _COND.match(line)
        if m:
            out.append((m.group(1), m.group(2), m.group(3)))
    return out


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _match(data: dict, conds: list[tuple]) -> bool:
    if not conds:
        return False  # no criteria → no dynamic membership (avoid accidental "all")
    for field, op, target in conds:
        actual = (data or {}).get(field)
        if op == "=":
            if str(actual).lower() != target.lower():
                return False
        elif op == "!=":
            if str(actual).lower() == target.lower():
                return False
        elif op == "~":
            if target.lower() not in str(actual or "").lower():
                return False
        elif op in (">", "<", ">=", "<="):
            a, t = _num(actual), _num(target)
            if a is None or t is None:
                return False
            if op == ">" and not a > t: return False
            if op == "<" and not a < t: return False
            if op == ">=" and not a >= t: return False
            if op == "<=" and not a <= t: return False
    return True


async def _already_enrolled(db, lead_id, journey_name) -> bool:
    return (await db.execute(
        select(EntityRecord.id).where(
            EntityRecord.entity_type == "journey_enrollments", EntityRecord.is_deleted == "N",
        ).where(text("data->>'subject_id' = :sid AND data->>'journey_name' = :jn AND data->>'status' = 'Active'"))
        .params(sid=str(lead_id), jn=journey_name)
    )).first() is not None


async def materialize(db: AsyncSession, segment: EntityRecord) -> dict:
    cfg = segment.data or {}
    conds = parse_criteria(cfg.get("criteria"))
    leads = (await db.execute(
        select(EntityRecord).where(EntityRecord.entity_type == "leads", EntityRecord.is_deleted == "N")
    )).scalars().all()
    members = [l for l in leads if _match(l.data, conds)]

    segment.data = {**cfg, "member_count": len(members),
                    "last_materialized": datetime.utcnow().isoformat()}
    segment.last_modified_at = datetime.utcnow()

    enrolled = 0
    journey = cfg.get("journey_name")
    if journey:
        for l in members:
            if not await _already_enrolled(db, l.id, journey):
                d = l.data or {}
                db.add(EntityRecord(
                    entity_type="journey_enrollments", module_code="marketing",
                    data={"name": f"{journey} · {d.get('name') or d.get('email') or l.id}",
                          "journey_name": journey, "subject_id": str(l.id),
                          "subject_email": d.get("email"), "subject_name": d.get("name"),
                          "status": "Active", "current_step": 0,
                          "enrolled_at": datetime.utcnow().isoformat(),
                          "next_run_at": datetime.utcnow().isoformat(),
                          "source": f"segment:{cfg.get('name')}"},
                    organization_id=l.organization_id, created_by=SYS_USER, last_modified_by=SYS_USER,
                ))
                enrolled += 1
    await db.commit()
    return {"segment": cfg.get("name"), "criteria_rules": len(conds),
            "member_count": len(members), "enrolled": enrolled, "journey": journey}


async def materialize_all(db: AsyncSession) -> dict:
    segs = (await db.execute(
        select(EntityRecord).where(EntityRecord.entity_type == "segments", EntityRecord.is_deleted == "N")
    )).scalars().all()
    done = 0
    for seg in segs:
        if (seg.data or {}).get("status", "Active") != "Archived":
            await materialize(db, seg)
            done += 1
    return {"segments_materialized": done}
