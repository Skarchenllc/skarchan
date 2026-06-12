"""
Customer Service Service Requests API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("customer_service", "service_requests")
