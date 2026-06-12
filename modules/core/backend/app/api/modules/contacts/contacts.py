"""
Contacts API - Using Centralized Entity System

People records. The Contacts module is the central system-of-record for people;
other modules (Sales, Marketing, Service…) reference these via entity_reference
fields rather than keeping their own copies.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("contacts", "contacts")
