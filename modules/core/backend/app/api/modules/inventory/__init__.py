"""
Inventory Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import warehouses, stock_items, stock_transfers

router = APIRouter()

router.include_router(warehouses.router, prefix="/warehouses", tags=["Inventory - Warehouses"])
router.include_router(stock_items.router, prefix="/stock-items", tags=["Inventory - Stock Items"])
router.include_router(stock_transfers.router, prefix="/stock-transfers", tags=["Inventory - Stock Transfers"])
