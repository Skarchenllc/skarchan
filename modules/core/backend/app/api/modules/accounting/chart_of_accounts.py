"""
Accounting & Finance Chart of Accounts API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("accounting", "chart_of_accounts")
