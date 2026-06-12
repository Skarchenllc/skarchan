"""
PM Time Tracking API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("project_management", "time_tracking")
