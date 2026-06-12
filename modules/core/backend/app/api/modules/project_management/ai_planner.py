"""PM Auto-Planner endpoint.

Thin wrapper over the centralized AI gateway: it delegates to the
`project_auto_plan` capability, which generates the work breakdown and persists
it as pm_projects / pm_milestones / pm_tasks. Kept as a dedicated route for the
existing PM UI; the engine and registry now live in app.services.ai.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.ai.gateway import run_capability, apply_capability

router = APIRouter()


class AutoPlanRequest(BaseModel):
    brief: str
    created_by: str | None = None
    organization_id: str | None = None


class ApplyPlanRequest(BaseModel):
    plan: dict
    created_by: str | None = None
    organization_id: str | None = None


@router.post("")
@router.post("/")
async def auto_plan(req: AutoPlanRequest, db: AsyncSession = Depends(get_db)):
    """Generate a project + milestones + tasks from a free-text brief."""
    brief = (req.brief or "").strip()
    if len(brief) < 10:
        raise HTTPException(status_code=400, detail="Please provide a project brief of at least a sentence.")

    today = datetime.utcnow().date().isoformat()
    # This is an explicit, already-shipped action, so it bypasses the section
    # toggle (enforce_gate=False). New module integrations should go through
    # POST /api/v1/ai/run, which honors the AI Management toggles.
    outcome = await run_capability(
        db, "project_auto_plan",
        module_code="pm", entity_type="pm_projects",
        context={"brief": brief, "today": today},
        actor_raw=req.created_by, org_raw=req.organization_id,
        enforce_gate=False,
    )
    # Preserve the response shape the PM frontend expects.
    return outcome["result"]


@router.post("/preview")
async def auto_plan_preview(req: AutoPlanRequest, db: AsyncSession = Depends(get_db)):
    """Draft a project plan for review without persisting anything."""
    brief = (req.brief or "").strip()
    if len(brief) < 10:
        raise HTTPException(status_code=400, detail="Please provide a project brief of at least a sentence.")
    today = datetime.utcnow().date().isoformat()
    out = await run_capability(
        db, "project_auto_plan", module_code="pm", entity_type="pm_projects",
        context={"brief": brief, "today": today},
        actor_raw=req.created_by, org_raw=req.organization_id,
        enforce_gate=False, dry_run=True,
    )
    return {"plan": out["result"], "usage": out["usage"]}


@router.post("/apply")
async def auto_plan_apply(req: ApplyPlanRequest, db: AsyncSession = Depends(get_db)):
    """Persist a reviewed project plan."""
    if not req.plan:
        raise HTTPException(status_code=400, detail="No plan provided.")
    today = datetime.utcnow().date().isoformat()
    out = await apply_capability(
        db, "project_auto_plan", module_code="pm", entity_type="pm_projects",
        result=req.plan, context={"today": today},
        actor_raw=req.created_by, org_raw=req.organization_id, enforce_gate=False,
    )
    return out["result"]
