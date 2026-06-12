from fastapi import APIRouter
from . import entity_records

router = APIRouter()

# Import and include endpoint routers here
# from . import items
# router.include_router(items.router, prefix="/items", tags=["items"])

@router.get("/")
async def root():
    return {"message": "API is working"}
