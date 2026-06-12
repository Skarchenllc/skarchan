"""
Research & Development Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import rd_projects
from . import experiments
from . import prototypes
from . import research_papers
from . import patents
from . import lab_equipment
from . import research_team_members
from . import rd_milestones
from . import rd_budgets
from . import rd_collaborations

router = APIRouter()

router.include_router(rd_projects.router, prefix="/rd-projects", tags=["Research & Development - R&D Projects"])
router.include_router(experiments.router, prefix="/experiments", tags=["Research & Development - Experiments"])
router.include_router(prototypes.router, prefix="/prototypes", tags=["Research & Development - Prototypes"])
router.include_router(research_papers.router, prefix="/research-papers", tags=["Research & Development - Research Papers"])
router.include_router(patents.router, prefix="/patents", tags=["Research & Development - Patents"])
router.include_router(lab_equipment.router, prefix="/lab-equipment", tags=["Research & Development - Lab Equipment"])
router.include_router(research_team_members.router, prefix="/research-team-members", tags=["Research & Development - Research Team"])
router.include_router(rd_milestones.router, prefix="/rd-milestones", tags=["Research & Development - Milestones"])
router.include_router(rd_budgets.router, prefix="/rd-budgets", tags=["Research & Development - R&D Budgets"])
router.include_router(rd_collaborations.router, prefix="/rd-collaborations", tags=["Research & Development - Collaborations"])
