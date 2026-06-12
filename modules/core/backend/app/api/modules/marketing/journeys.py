"""Marketing Automation Journeys API - drip sequence definitions (entity_records)."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "journeys")
