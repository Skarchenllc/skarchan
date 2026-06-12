"""
Quality Management Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import inspections, nonconformances, corrective_actions

router = APIRouter()

router.include_router(inspections.router, prefix="/inspections", tags=["QMS - Inspections"])
router.include_router(nonconformances.router, prefix="/nonconformances", tags=["QMS - Non-Conformances"])
router.include_router(corrective_actions.router, prefix="/corrective-actions", tags=["QMS - Corrective Actions"])
