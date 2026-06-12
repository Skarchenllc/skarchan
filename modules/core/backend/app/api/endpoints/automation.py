"""
Automation Center API.

The automation *rules* and *runs* are stored as entity_records (so they reuse
the generic list/form UI), but the behaviour lives here + in
app.services.automation.engine.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.automation.engine import (
    run_automation, fire_event,
    ACTION_TYPES, TRIGGER_EVENTS, CONDITION_OPS,
)
from app.services.ai.jobs import process_ai_jobs, approve_job, reject_job
from app.services.automation import ledger as action_ledger

router = APIRouter()


@router.get("/catalog")
async def catalog():
    """Options the builder UI needs to render trigger/condition/action pickers."""
    return {
        "trigger_events": TRIGGER_EVENTS,
        "condition_ops": CONDITION_OPS,
        "action_types": ACTION_TYPES,
    }


@router.post("/automations/{automation_id}/run")
async def run(automation_id: str, db: AsyncSession = Depends(get_db)):
    """Apply a rule to all existing records of its trigger entity (batch / apply-to-existing)."""
    result = await run_automation(db, automation_id)
    if result.get("error"):
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@router.post("/fire")
async def fire(payload: dict, db: AsyncSession = Depends(get_db)):
    """
    Manually fire an event for testing:
      { "event": "created", "entity_type": "leads", "record_id": "<uuid>" }
    """
    event = payload.get("event", "updated")
    entity_type = payload.get("entity_type")
    record_id = payload.get("record_id")
    data = payload.get("data") or {}
    if not entity_type or not record_id:
        raise HTTPException(status_code=400, detail="entity_type and record_id are required")
    await fire_event(db, event, entity_type, record_id, data, payload.get("prev_data"))
    return {"fired": True, "event": event, "entity_type": entity_type}


@router.post("/ai-jobs/run")
async def ai_jobs_run(db: AsyncSession = Depends(get_db)):
    """Drain the AI job queue enqueued by `ai_run` automation actions. (Cron this.)"""
    return await process_ai_jobs(db)


@router.post("/ai-jobs/{job_id}/approve")
async def ai_job_approve(job_id: str, db: AsyncSession = Depends(get_db)):
    """Approve a Pending Review AI job — applies the write/draft (human-in-loop)."""
    result = await approve_job(db, job_id)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.post("/ai-jobs/{job_id}/reject")
async def ai_job_reject(job_id: str, db: AsyncSession = Depends(get_db)):
    """Reject a Pending Review AI job — discards it without applying."""
    result = await reject_job(db, job_id)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@router.get("/ledger")
async def ledger_list(include_reversed: bool = True, limit: int = 100,
                      db: AsyncSession = Depends(get_db)):
    """The reversible action ledger — before/after of every applied action."""
    return await action_ledger.list_entries(db, limit=limit, include_reversed=include_reversed)


@router.post("/ledger/{ledger_id}/undo")
async def ledger_undo(ledger_id: str, db: AsyncSession = Depends(get_db)):
    """Reverse one ledger entry (restore a field, or soft-delete a created record)."""
    result = await action_ledger.undo(db, ledger_id)
    if result.get("error"):
        raise HTTPException(status_code=400, detail=result["error"])
    return result
