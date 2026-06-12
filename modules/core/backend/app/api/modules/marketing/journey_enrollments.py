"""Marketing Automation Journey Enrollments API - subjects moving through a journey."""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("marketing", "journey_enrollments")
