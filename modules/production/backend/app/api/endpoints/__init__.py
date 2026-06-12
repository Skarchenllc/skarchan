from fastapi import APIRouter
from app.api.endpoints import products, bom, work_orders, inventory, production_lines

# Create main API router
api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(products.router)
api_router.include_router(bom.router)
api_router.include_router(work_orders.router)
api_router.include_router(inventory.router)
api_router.include_router(production_lines.router)

__all__ = ["api_router"]
