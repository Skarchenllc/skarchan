"""AI access control — who may run write actions and approve/administer AI.

Policy (configurable in AI Management, stored in the global config):
  - writes_require:    'any_user' | 'admin'   (Create / Update records)
  - approvals_require: 'any_user' | 'admin'    (approve pending changes + AI admin)

'admin' means the user holds an admin-type role. Reads (Ask/Summarize/…) are
open to any authenticated user.
"""
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from . import settings as ai_settings

ADMIN_ROLES = {"super_admin", "admin", "administrator", "adminstrator", "org_admin"}


async def role_codes(db: AsyncSession, user) -> set[str]:
    if not user:
        return set()
    rows = (await db.execute(
        text("SELECT r.role_code FROM core_user_roles ur JOIN core_roles r ON r.id = ur.role_id "
             "WHERE ur.user_id = :uid"),
        {"uid": str(user.id)})).all()
    return {row[0] for row in rows}


async def is_admin(db: AsyncSession, user) -> bool:
    return bool(ADMIN_ROLES & await role_codes(db, user))


async def me(db: AsyncSession, user) -> dict:
    return {
        "authenticated": user is not None,
        "email": getattr(user, "email", None),
        "roles": sorted(await role_codes(db, user)) if user else [],
        "is_admin": await is_admin(db, user),
    }


async def require(db: AsyncSession, user, level: str):
    """Enforce an access level ('write' | 'admin'). Raises 401/403 or returns the user."""
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in to use this AI action.")
    gov = await ai_settings.get_global(db)
    rule = gov["writes_require"] if level == "write" else gov["approvals_require"]
    if rule == "admin" and not await is_admin(db, user):
        what = "create/update records" if level == "write" else "approve or administer AI"
        raise HTTPException(status_code=403, detail=f"You don't have permission to {what}. Ask an admin.")
    return user
