from fastapi import APIRouter
from . import campaigns, leads, content

router = APIRouter()

# Include endpoint routers (no prefix - endpoints already have their paths)
router.include_router(campaigns.router, tags=["campaigns"])
router.include_router(leads.router, tags=["leads"])
router.include_router(content.router, tags=["content"])

@router.get("/")
async def root():
    return {"message": "Marketing API is working"}
