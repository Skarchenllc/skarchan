"""
Administration Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from app.api.modules.entity_crud_template import create_entity_router
from . import compliance_audits
from . import compliance_policies
from . import executive_board
from . import legal_cases
from . import roles
from . import permissions
# strategic_initiatives moved to project_management module

router = APIRouter()

router.include_router(compliance_audits.router, prefix="/compliance-audits", tags=["Administration - Compliance Audits"])
router.include_router(compliance_policies.router, prefix="/compliance-policies", tags=["Administration - Compliance Policies"])
router.include_router(executive_board.router, prefix="/executive-board", tags=["Administration - Executive Board"])
router.include_router(legal_cases.router, prefix="/legal-cases", tags=["Administration - Legal Cases"])
router.include_router(roles.router, prefix="/roles", tags=["Administration - User Roles"])
router.include_router(permissions.router, prefix="/permissions", tags=["Administration - Permissions"])
# strategic-initiatives now served from /api/v1/pm/strategic-initiatives

# Sub-branches that remain in Administration.
router.include_router(create_entity_router("administration", "contracts"),          prefix="/contracts",          tags=["Administration - Contracts"])
router.include_router(create_entity_router("administration", "documents"),          prefix="/documents",          tags=["Administration - Documents"])
router.include_router(create_entity_router("administration", "credentials"),        prefix="/credentials",        tags=["Administration - Credentials"])
router.include_router(create_entity_router("administration", "risks"),              prefix="/risks",              tags=["Administration - Risk Register"])
router.include_router(create_entity_router("administration", "licenses"),           prefix="/licenses",           tags=["Administration - Licenses & Permits"])
router.include_router(create_entity_router("administration", "board_meetings"),     prefix="/board-meetings",     tags=["Administration - Board Meetings"])
router.include_router(create_entity_router("administration", "insurance_policies"), prefix="/insurance-policies", tags=["Administration - Insurance Policies"])

# `assets` and `subscriptions` moved to Accounting & Finance — see
# app/api/modules/accounting/__init__.py
