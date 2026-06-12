"""Marketing Automation Scoring Rules API - configurable event→points (entity_records)."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "scoring_rules")
