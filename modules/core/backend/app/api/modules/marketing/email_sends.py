"""Marketing Automation Email Sends API - outbound email log (entity_records)."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "email_sends")
