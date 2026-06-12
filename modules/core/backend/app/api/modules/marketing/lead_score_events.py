"""Marketing Automation Lead Score Events API - scoring audit log (entity_records)."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "lead_score_events")
