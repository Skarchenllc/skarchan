"""
Organizations API - Using Centralized Entity System

Organization / company records (entity_type ``sales_accounts``, kept under that
name to avoid colliding with Accounting's ``accounts`` GL type). Owned by the
central Contacts module and referenced by other modules.
"""
from app.api.modules.entity_crud_template import create_entity_router

router = create_entity_router("contacts", "sales_accounts")
