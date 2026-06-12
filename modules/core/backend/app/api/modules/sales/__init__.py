"""
Sales Management Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import customers
from . import opportunities
from . import quotes
from . import orders
from . import activities
from . import products

router = APIRouter()

# accounts + contacts moved to the central Contacts module (app.api.modules.contacts)
router.include_router(customers.router, prefix="/customers", tags=["Sales Management - Sales Customers"])
router.include_router(opportunities.router, prefix="/opportunities", tags=["Sales Management - Sales Opportunities"])
router.include_router(quotes.router, prefix="/quotes", tags=["Sales Management - Sales Quotes"])
router.include_router(orders.router, prefix="/orders", tags=["Sales Management - Sales Orders"])
router.include_router(activities.router, prefix="/activities", tags=["Sales Management - Sales Activities"])
router.include_router(products.router, prefix="/products", tags=["Sales Management - Sales Products"])
