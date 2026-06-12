"""
Contacts Module APIs - Consolidated in Core Backend

Central system-of-record for people (``contacts``) and organizations
(``sales_accounts``). Other modules reference these records.
"""
from fastapi import APIRouter
from . import contacts
from . import organizations

router = APIRouter()

router.include_router(contacts.router, prefix="/contacts", tags=["Contacts Module - People"])
router.include_router(organizations.router, prefix="/organizations", tags=["Contacts Module - Organizations"])
