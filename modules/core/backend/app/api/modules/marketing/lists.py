"""
Marketing Automation Lists API - Using Centralized Entity System

Static / dynamic contact & lead lists for campaign targeting.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "lists")
