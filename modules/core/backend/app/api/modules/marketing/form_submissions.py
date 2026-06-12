"""Marketing Automation Form Submissions API - raw inbound submission log (entity_records)."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "form_submissions")
