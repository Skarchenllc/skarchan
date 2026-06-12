"""
Production Management Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import production_products
from . import inventory
from . import bill_of_materials
from . import production_lines
from . import work_orders

router = APIRouter()

router.include_router(production_products.router, prefix="/production-products", tags=["Production Management - Products"])
router.include_router(inventory.router, prefix="/inventory", tags=["Production Management - Inventory"])
router.include_router(bill_of_materials.router, prefix="/bill-of-materials", tags=["Production Management - Bill of Materials"])
router.include_router(production_lines.router, prefix="/production-lines", tags=["Production Management - Production Lines"])
router.include_router(work_orders.router, prefix="/work-orders", tags=["Production Management - Manufacturing Work Orders"])
