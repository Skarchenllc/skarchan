"""
Lead-scoring engine.

Engagement events add points to a lead. Points come from configurable
`scoring_rules` records (event → points), falling back to DEFAULT_POINTS. As a
lead's score rises it gets a grade (Cold/Warm/Hot); crossing QUALIFY_THRESHOLD
flips its status to 'Qualified' and fires the automation engine's `updated`
event on the lead — so a rule like "lead qualified → enroll in sales-handoff
journey" runs automatically. Every change is logged as a `lead_score_events`
record.

Driven from two places:
  • development.py create hook — when a `lead_activities` record is created.
  • marketing/ops.py — when an email is Opened/Clicked.
Plus a batch `recompute_all` that rebuilds scores from existing activity.
"""
from __future__ import annotations

import os
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.entity_record import EntityRecord

SYS_USER = uuid.UUID("00000000-0000-0000-0000-000000000001")

# event key → points. Activity-type labels are normalised to these keys.
DEFAULT_POINTS = {
    "email_opened": 5,
    "link_clicked": 10,
    "email_clicked": 10,
    "form_submitted": 20,
    "call_made": 15,
    "meeting": 15,
    "page_view": 2,
}
QUALIFY_THRESHOLD = 50

# Score decay — keeps "Hot" tied to *current* intent. An engagement keeps full
# weight for DECAY_GRACE_DAYS, then halves every DECAY_HALF_LIFE_DAYS. Applied
# when scores are rebuilt (recompute_all), which the scheduler runs periodically.
DECAY_GRACE_DAYS = float(os.getenv("SCORE_DECAY_GRACE_DAYS", "7"))
DECAY_HALF_LIFE_DAYS = float(os.getenv("SCORE_DECAY_HALF_LIFE_DAYS", "30"))


def decay_weight(age_days: float) -> float:
    """1.0 within the grace window, then exponential half-life decay."""
    if age_days <= DECAY_GRACE_DAYS:
        return 1.0
    return 0.5 ** ((age_days - DECAY_GRACE_DAYS) / DECAY_HALF_LIFE_DAYS)


def normalize_event(label: Optional[str]) -> str:
    return (label or "").strip().lower().replace(" ", "_")


def grade_for(score: int) -> str:
    if score >= QUALIFY_THRESHOLD:
        return "Hot"
    if score >= 20:
        return "Warm"
    return "Cold"


async def _points_for(db: AsyncSession, event: str) -> int:
    """Configurable points: a scoring_rules record wins over the default map."""
    res = await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "scoring_rules",
            EntityRecord.is_deleted == "N",
        )
    )
    for r in res.scalars().all():
        if normalize_event((r.data or {}).get("event")) == event:
            try:
                return int((r.data or {}).get("points") or 0)
            except (TypeError, ValueError):
                return 0
    return DEFAULT_POINTS.get(event, 0)


async def _find_lead(db, lead_id=None, lead_email=None):
    if lead_id:
        try:
            r = (await db.execute(select(EntityRecord).where(EntityRecord.id == uuid.UUID(str(lead_id))))).scalar_one_or_none()
            if r and r.entity_type == "leads" and r.is_deleted == "N":
                return r
        except Exception:
            pass
    if lead_email:
        r = (await db.execute(
            select(EntityRecord).where(
                EntityRecord.entity_type == "leads",
                EntityRecord.is_deleted == "N",
            ).where(text("data->>'email' = :e")).params(e=lead_email)
        )).scalars().first()
        return r
    return None


async def apply_event(db: AsyncSession, event_label: str, *, lead_id=None,
                      lead_email=None, points: Optional[int] = None) -> dict:
    """Add points to a lead for one engagement event. Self-committing."""
    event = normalize_event(event_label)
    lead = await _find_lead(db, lead_id, lead_email)
    if lead is None:
        return {"skipped": "lead not found", "event": event}

    pts = points if points is not None else await _points_for(db, event)
    d = dict(lead.data or {})
    old = int(d.get("score") or 0)
    new = old + pts
    prev = dict(d)
    d["score"] = new
    d["grade"] = grade_for(new)

    qualified_now = False
    if new >= QUALIFY_THRESHOLD and d.get("status") not in ("Qualified", "Converted"):
        d["status"] = "Qualified"
        qualified_now = True
    lead.data = d
    lead.last_modified_by = SYS_USER
    lead.last_modified_at = datetime.utcnow()

    db.add(EntityRecord(
        entity_type="lead_score_events", module_code="marketing",
        data={
            "name": f"{d.get('name') or d.get('email') or lead.id} +{pts} ({event})",
            "lead_id": str(lead.id), "lead_name": d.get("name"),
            "event": event, "points": pts,
            "old_score": old, "new_score": new, "grade": d["grade"],
            "qualified": qualified_now,
            "scored_at": datetime.utcnow().isoformat(),
        },
        organization_id=lead.organization_id, created_by=SYS_USER, last_modified_by=SYS_USER,
    ))
    await db.commit()

    # Crossing the qualify line is a real state change → let automations react.
    if qualified_now:
        from app.services.automation.engine import fire_event
        await fire_event(db, "updated", "leads", lead.id, d, prev)

    return {"lead": d.get("name"), "event": event, "points": pts,
            "old_score": old, "new_score": new, "grade": d["grade"], "qualified": qualified_now}


async def recompute_all(db: AsyncSession, limit: int = 5000) -> dict:
    """
    Rebuild every lead's score as the **recency-weighted** sum of its engagement
    (lead_activities + email opens/clicks). Each event contributes
    points × decay_weight(age) so old activity fades and the grade tracks current
    intent. This is the decay mechanism — the scheduler runs it periodically.
    """
    now = datetime.utcnow()
    by_id, by_email, by_name = {}, {}, {}     # weighted points
    t_id, t_email, t_name = {}, {}, {}         # latest engagement time

    def add(bucket, tbucket, key, pts, when):
        if not key or not pts:
            return
        age = max(0.0, (now - when).total_seconds() / 86400) if when else 0.0
        bucket[key] = bucket.get(key, 0.0) + pts * decay_weight(age)
        if when and (key not in tbucket or when > tbucket[key]):
            tbucket[key] = when

    acts = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "lead_activities",
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )).scalars().all()
    for a in acts:
        d = a.data or {}
        pts = await _points_for(db, normalize_event(d.get("activity_type")))
        if d.get("lead_id"):
            add(by_id, t_id, str(d["lead_id"]), pts, a.created_at)
        elif d.get("lead_email") or d.get("subject_email"):
            add(by_email, t_email, d.get("lead_email") or d.get("subject_email"), pts, a.created_at)
        elif d.get("lead_name"):
            add(by_name, t_name, d["lead_name"], pts, a.created_at)

    # Email opens/clicks are engagement too — match by recipient email.
    sends = (await db.execute(
        select(EntityRecord).where(
            EntityRecord.entity_type == "email_sends",
            EntityRecord.is_deleted == "N",
        ).limit(limit)
    )).scalars().all()
    for s in sends:
        d = s.data or {}
        st = d.get("status")
        ev = "link_clicked" if st == "Clicked" else ("email_opened" if st == "Opened" else None)
        if ev:
            add(by_email, t_email, d.get("to_email"), await _points_for(db, ev), s.created_at)

    leads = (await db.execute(
        select(EntityRecord).where(EntityRecord.entity_type == "leads", EntityRecord.is_deleted == "N")
    )).scalars().all()
    updated = qualified = 0
    for lead in leads:
        d = dict(lead.data or {})
        raw = by_id.get(str(lead.id), 0.0) + by_email.get(d.get("email"), 0.0) + by_name.get(d.get("name"), 0.0)
        score = round(raw)
        d["score"] = score
        d["grade"] = grade_for(score)
        latest = max([t for t in (t_id.get(str(lead.id)), t_email.get(d.get("email")), t_name.get(d.get("name"))) if t], default=None)
        if latest:
            d["last_scored_at"] = latest.isoformat()
        if score >= QUALIFY_THRESHOLD and d.get("status") not in ("Qualified", "Converted"):
            d["status"] = "Qualified"
            qualified += 1
        lead.data = d
        lead.last_modified_at = now
        updated += 1
    await db.commit()
    return {"leads_scored": updated, "auto_qualified": qualified,
            "half_life_days": DECAY_HALF_LIFE_DAYS, "grace_days": DECAY_GRACE_DAYS}
