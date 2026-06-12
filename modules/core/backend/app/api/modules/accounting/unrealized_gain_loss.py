"""
Accounting & Finance Unrealized FX Gains/Losses API - Using Centralized Entity System
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("accounting", "unrealized_gain_loss")
