"""
Project Management Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import pm_projects, pm_tasks, pm_milestones, pm_resources, time_tracking, pm_budgets, ai_planner

router = APIRouter()

router.include_router(ai_planner.router, prefix="/auto-plan", tags=["PM - AI Auto-Planner"])
router.include_router(pm_projects.router, prefix="/projects", tags=["PM - Projects"])
router.include_router(pm_tasks.router, prefix="/tasks", tags=["PM - Tasks"])
router.include_router(pm_milestones.router, prefix="/milestones", tags=["PM - Milestones"])
router.include_router(pm_resources.router, prefix="/resources", tags=["PM - Resources"])
router.include_router(time_tracking.router, prefix="/time-tracking", tags=["PM - Time Tracking"])
router.include_router(pm_budgets.router, prefix="/budgets", tags=["PM - Budgets"])

# Moved from Administration:
from app.api.modules.entity_crud_template import create_entity_router
router.include_router(
    create_entity_router("pm", "strategic_initiatives"),
    prefix="/strategic-initiatives",
    tags=["PM - Strategic Initiatives"],
)
