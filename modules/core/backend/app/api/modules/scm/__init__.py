"""
SCM Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import suppliers, purchase_orders, purchase_requisitions, rfq, supplier_contracts

router = APIRouter()

router.include_router(suppliers.router, prefix="/suppliers", tags=["SCM - Suppliers"])
router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["SCM - Purchase Orders"])
router.include_router(purchase_requisitions.router, prefix="/purchase-requisitions", tags=["SCM - Purchase Requisitions"])
router.include_router(rfq.router, prefix="/rfq", tags=["SCM - RFQ"])
router.include_router(supplier_contracts.router, prefix="/supplier-contracts", tags=["SCM - Supplier Contracts"])
