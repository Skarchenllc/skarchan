"""
Sales Management Activities API - Using Centralized Entity System

Sales activities (calls, meetings, tasks, notes) owned by the Sales module.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("sales", "activities")
