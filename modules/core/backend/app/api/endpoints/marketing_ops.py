"""
Marketing execution API — the behaviour behind the Marketing module:
real email sending (simulated delivery) and a journey/drip runner.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.entity_record import EntityRecord
from app.services.marketing.ops import (
    send_email, process_email_queue, run_journeys, enroll_subjects,
)
from app.services.marketing.segments import materialize, materialize_all
from app.services.marketing.scoring import (
    apply_event, recompute_all, DEFAULT_POINTS, QUALIFY_THRESHOLD,
    DECAY_HALF_LIFE_DAYS, DECAY_GRACE_DAYS,
)

router = APIRouter()


@router.post("/email/send")
async def email_send(payload: dict, db: AsyncSession = Depends(get_db)):
    """Send one email now: { to_email, to_name?, template_name?, subject?, body? }"""
    if not payload.get("to_email"):
        raise HTTPException(status_code=400, detail="to_email is required")
    org = payload.get("organization_id")
    return await send_email(
        db,
        to_email=payload["to_email"], to_name=payload.get("to_name"),
        template_name=payload.get("template_name"), subject=payload.get("subject"),
        body=payload.get("body"),
        org_id=uuid.UUID(org) if org else None, source=payload.get("source"),
    )


@router.post("/email/process-queue")
async def email_process_queue(db: AsyncSession = Depends(get_db)):
    """Deliver all Queued emails (e.g. those enqueued by automations)."""
    return await process_email_queue(db)


@router.post("/journeys/{journey_id}/enroll")
async def journey_enroll(journey_id: str, payload: dict | None = None, db: AsyncSession = Depends(get_db)):
    """Enroll an audience (default: leads) into a journey."""
    payload = payload or {}
    result = await enroll_subjects(db, journey_id, entity_type=payload.get("entity_type"),
                                   limit=int(payload.get("limit", 200)))
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/journeys/run")
async def journey_run(db: AsyncSession = Depends(get_db)):
    """One tick of the drip runner — advance every due enrollment. (Cron this.)"""
    return await run_journeys(db)


@router.post("/segments/{segment_id}/materialize")
async def segment_materialize(segment_id: str, db: AsyncSession = Depends(get_db)):
    """Evaluate a segment's criteria → membership (and auto-enroll its journey)."""
    try:
        sid = uuid.UUID(segment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="invalid segment id")
    seg = (await db.execute(
        select(EntityRecord).where(EntityRecord.id == sid, EntityRecord.entity_type == "segments")
    )).scalar_one_or_none()
    if seg is None:
        raise HTTPException(status_code=404, detail="segment not found")
    return await materialize(db, seg)


@router.post("/segments/materialize-all")
async def segments_materialize_all(db: AsyncSession = Depends(get_db)):
    """Re-evaluate every active segment (the scheduler calls this)."""
    return await materialize_all(db)


@router.get("/scoring/catalog")
async def scoring_catalog():
    """Default points map + qualify threshold for the scoring UI."""
    return {"default_points": DEFAULT_POINTS, "qualify_threshold": QUALIFY_THRESHOLD,
            "grades": {"Cold": "< 20", "Warm": "20–49", "Hot": ">= 50"},
            "decay": {"grace_days": DECAY_GRACE_DAYS, "half_life_days": DECAY_HALF_LIFE_DAYS}}


@router.post("/scoring/event")
async def scoring_event(payload: dict, db: AsyncSession = Depends(get_db)):
    """Score a single engagement: { event, lead_id? | lead_email?, points? }"""
    if not payload.get("event"):
        raise HTTPException(status_code=400, detail="event is required")
    return await apply_event(db, payload["event"], lead_id=payload.get("lead_id"),
                             lead_email=payload.get("lead_email"), points=payload.get("points"))


@router.post("/scoring/recompute")
async def scoring_recompute(db: AsyncSession = Depends(get_db)):
    """Rebuild all lead scores from their accumulated lead_activities."""
    return await recompute_all(db)
