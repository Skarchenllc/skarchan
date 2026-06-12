"""
QMS Non-Conformances (NCRs) API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("qms", "qms_nonconformances")
