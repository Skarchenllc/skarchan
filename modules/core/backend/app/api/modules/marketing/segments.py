"""
Marketing Automation Segments API - Using Centralized Entity System

Audience segments used to target campaigns.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "segments")
