"""
SCM Supplier Contracts API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("scm", "supplier_contracts")
