from fastapi import APIRouter
from . import customers, opportunities, quotes, orders

router = APIRouter()

# Include endpoint routers (no prefix - endpoints already have their paths)
router.include_router(customers.router, tags=["customers"])
router.include_router(opportunities.router, tags=["opportunities"])
router.include_router(quotes.router, tags=["quotes"])
router.include_router(orders.router, tags=["orders"])

@router.get("/")
async def root():
    return {"message": "Sales API is working"}
