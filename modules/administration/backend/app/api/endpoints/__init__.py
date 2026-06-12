from fastapi import APIRouter
from app.api.endpoints import (
    executive_board,
    legal_cases,
    compliance_policies,
    compliance_audits,
    strategic_initiatives,
    control_room,
    uploads
)

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(control_room.router, prefix="/control-room", tags=["Control Room"])
api_router.include_router(executive_board.router)
api_router.include_router(legal_cases.router)
api_router.include_router(compliance_policies.router)
api_router.include_router(compliance_audits.router)
api_router.include_router(strategic_initiatives.router)
api_router.include_router(uploads.router)

__all__ = ["api_router"]
