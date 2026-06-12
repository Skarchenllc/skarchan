"""
Company profile endpoint.

Multi-tenant SaaS: each organization (the tenant) maintains its own identity —
name, logo, address, contact details, tax IDs, currency. These are surfaced in
the app shell and on generated documents (invoices, bills, payslips, mail).

The data already lives on `core_organizations`; this endpoint exposes a flat,
document-friendly view of the *current user's* organization and lets it be
edited from Settings. Fields without a dedicated column are kept in the
`organization_settings` JSONB blob.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any, Dict, Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.user import User
from app.models.organization import Organization
from app.api.dependencies import get_current_user

router = APIRouter()


# Extra identity fields that have no dedicated column — stored in JSONB.
_EXTRA_KEYS = ("legal_name", "tax_id", "registration_number", "website", "footer_note")


class CompanyProfile(BaseModel):
    # Identity
    org_name: Optional[str] = None
    legal_name: Optional[str] = None
    org_description: Optional[str] = None
    industry: Optional[str] = None
    business_type: Optional[str] = None
    company_size: Optional[str] = None
    # Branding
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    # Locale / finance
    currency_code: Optional[str] = None
    timezone: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None
    # Contact
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[str] = None
    primary_contact_phone: Optional[str] = None
    website: Optional[str] = None
    custom_domain: Optional[str] = None
    # Address
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    # Document footer
    footer_note: Optional[str] = None


def _serialize(org: Organization) -> Dict[str, Any]:
    branding = org.branding or {}
    addr = org.billing_address or {}
    extra = org.organization_settings or {}
    return {
        "id": str(org.id),
        "org_code": org.org_code,
        "org_name": org.org_name,
        "legal_name": extra.get("legal_name") or "",
        "org_description": org.org_description or "",
        "industry": org.industry or "",
        "business_type": org.business_type or "",
        "company_size": org.company_size or "",
        "logo_url": branding.get("logo_url") or "",
        "primary_color": branding.get("primary_color") or "",
        "currency_code": org.currency_code or "USD",
        "timezone": org.timezone or "UTC",
        "tax_id": extra.get("tax_id") or "",
        "registration_number": extra.get("registration_number") or "",
        "primary_contact_name": org.primary_contact_name or "",
        "primary_contact_email": org.primary_contact_email or "",
        "primary_contact_phone": org.primary_contact_phone or "",
        "website": extra.get("website") or "",
        "custom_domain": org.custom_domain or "",
        "street": addr.get("street") or "",
        "city": addr.get("city") or "",
        "state": addr.get("state") or "",
        "postal_code": addr.get("postal_code") or "",
        "country": addr.get("country") or "",
        "footer_note": extra.get("footer_note") or "",
    }


async def _resolve_org(db: AsyncSession, current_user: User) -> Organization:
    org = (
        await db.execute(select(Organization).where(Organization.id == current_user.org_id))
    ).scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.get("/profile")
async def get_company_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the current user's organization as a flat company profile."""
    org = await _resolve_org(db, current_user)
    return _serialize(org)


@router.put("/profile")
async def update_company_profile(
    payload: CompanyProfile,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's organization identity. Only sent fields change."""
    org = await _resolve_org(db, current_user)
    data = payload.model_dump(exclude_unset=True)

    # Scalar columns
    column_map = {
        "org_name": "org_name",
        "org_description": "org_description",
        "industry": "industry",
        "business_type": "business_type",
        "company_size": "company_size",
        "currency_code": "currency_code",
        "timezone": "timezone",
        "primary_contact_name": "primary_contact_name",
        "primary_contact_email": "primary_contact_email",
        "primary_contact_phone": "primary_contact_phone",
        "custom_domain": "custom_domain",
    }
    for key, col in column_map.items():
        if key in data:
            setattr(org, col, data[key])

    # Branding JSONB (reassign so SQLAlchemy detects the change)
    if "logo_url" in data or "primary_color" in data:
        branding = dict(org.branding or {})
        if "logo_url" in data:
            branding["logo_url"] = data["logo_url"]
        if "primary_color" in data:
            branding["primary_color"] = data["primary_color"]
        org.branding = branding

    # Address JSONB
    addr_keys = ("street", "city", "state", "postal_code", "country")
    if any(k in data for k in addr_keys):
        addr = dict(org.billing_address or {})
        for k in addr_keys:
            if k in data:
                addr[k] = data[k]
        org.billing_address = addr

    # Extra JSONB fields
    if any(k in data for k in _EXTRA_KEYS):
        extra = dict(org.organization_settings or {})
        for k in _EXTRA_KEYS:
            if k in data:
                extra[k] = data[k]
        org.organization_settings = extra

    await db.commit()
    await db.refresh(org)
    return _serialize(org)
