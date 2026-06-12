"""
Accounting & Finance Currency Exchange Transactions API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("accounting", "currency_exchange_transactions")
