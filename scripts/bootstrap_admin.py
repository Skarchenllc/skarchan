"""
One-shot admin bootstrap for a fresh deployment.

A freshly-deployed instance starts with EMPTY core_* tables (no users, no roles),
so nothing can log in. This creates — idempotently — an organization, an admin
user, a "Super Admin" role (all permissions), and the assignment between them.

Run it ON THE INSTANCE, from the deploy dir, piping it into the backend container:

    docker compose -f docker-compose.prod.yml exec -T core-backend python - < scripts/bootstrap_admin.py

Optional env overrides (prefix the command, e.g. `ADMIN_PASSWORD=... docker compose ...`):
    ADMIN_USERNAME (default: admin)
    ADMIN_EMAIL    (default: admin@nexacore.app)
    ADMIN_PASSWORD (default: Admin123!)
    ORG_NAME       (default: Skarchen)
"""
import asyncio
import os
import uuid

from sqlalchemy import select

from app.db import session as S
from app.models.organization import Organization
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.security import get_password_hash

USERNAME = os.getenv("ADMIN_USERNAME", "admin")
EMAIL = os.getenv("ADMIN_EMAIL", "admin@nexacore.app")
PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin123!")
ORG_NAME = os.getenv("ORG_NAME", "Skarchen")


def _maker():
    for name in ("AsyncSessionLocal", "async_session_maker", "SessionLocal"):
        m = getattr(S, name, None)
        if m is not None:
            return m
    raise RuntimeError("Could not find an async session maker in app.db.session")


async def main():
    async with _maker()() as db:
        # 1) Organization — reuse the first one if any, else create.
        org = (await db.execute(select(Organization).limit(1))).scalar_one_or_none()
        if org is None:
            org = Organization(org_code="org-" + uuid.uuid4().hex[:8], org_name=ORG_NAME)
            db.add(org)
            await db.flush()
            print(f"+ created organization: {org.org_name}")
        else:
            print(f". using organization: {org.org_name}")

        # 2) Admin user — create or reset (password + unlock + activate).
        user = (await db.execute(select(User).where(User.username == USERNAME))).scalar_one_or_none()
        if user is None:
            user = User(
                org_id=org.id, username=USERNAME, email=EMAIL,
                hashed_password=get_password_hash(PASSWORD),
                first_name="Admin", last_name="User", full_name="Admin User",
                is_active=True,
            )
            db.add(user)
            await db.flush()
            print(f"+ created user: {USERNAME}")
        else:
            user.hashed_password = get_password_hash(PASSWORD)
            user.is_active = True
            if hasattr(user, "is_locked"):
                user.is_locked = False
            if hasattr(user, "failed_login_attempts"):
                user.failed_login_attempts = 0
            print(f". reset existing user: {USERNAME} (password + unlock)")

        # 3) Super Admin role (permissions ["*"] = everything).
        role = (await db.execute(
            select(Role).where(Role.org_id == user.org_id, Role.role_code == "super_admin")
        )).scalar_one_or_none()
        if role is None:
            role = Role(
                org_id=user.org_id, role_code="super_admin", role_name="Super Admin",
                permissions=["*"], is_active=True, deleted_flag=False, is_system_role=True,
            )
            db.add(role)
            await db.flush()
            print("+ created role: Super Admin (['*'])")
        else:
            role.permissions = ["*"]
            role.is_active = True
            role.deleted_flag = False
            print(". ensured Super Admin role is active with ['*']")

        # 4) Assignment — active, not deleted.
        ur = (await db.execute(
            select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role.id)
        )).scalar_one_or_none()
        if ur is None:
            db.add(UserRole(user_id=user.id, role_id=role.id, is_active=True, deleted_flag=False))
            print("+ assigned Super Admin to user")
        else:
            ur.is_active = True
            ur.deleted_flag = False
            print(". ensured Super Admin assignment is active")

        await db.commit()
        print(f"\nDONE — log in with:\n  username: {USERNAME}\n  password: {PASSWORD}")


asyncio.run(main())
