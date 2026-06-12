"""
Research & Development Research Papers API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("rd", "research_papers")
