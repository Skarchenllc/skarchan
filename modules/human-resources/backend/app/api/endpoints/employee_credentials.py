from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import Optional
from datetime import datetime
from uuid import UUID
import secrets
import string
import hashlib

from app.core.database import get_db

router = APIRouter()


def generate_password(length: int = 12) -> str:
    """Generate a random secure password"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for _ in range(length))


def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()


# ===== Employee Credentials Endpoints =====

@router.post("/employees/{employee_id}/credentials")
async def create_employee_credentials(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Create dashboard credentials for an employee"""
    # Check if employee exists
    employee_result = await db.execute(
        text("SELECT id, employee_code, first_name, last_name FROM employees WHERE id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    employee = employee_result.fetchone()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if credentials already exist
    cred_result = await db.execute(
        text("SELECT id FROM employee_credentials WHERE employee_id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    existing_cred = cred_result.fetchone()

    if existing_cred:
        raise HTTPException(status_code=400, detail="Credentials already exist for this employee")

    # Generate credentials
    username = employee[1]  # employee_code
    password = generate_password()
    password_hash = hash_password(password)

    # Insert credentials
    import uuid as uuid_lib
    cred_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO employee_credentials (id, employee_id, username, password_hash, is_active, must_change_password, created_at, updated_at)
            VALUES (:id, :employee_id, :username, :password_hash, true, true, NOW(), NOW())
        """),
        {
            "id": str(cred_id),
            "employee_id": str(employee_id),
            "username": username,
            "password_hash": password_hash
        }
    )
    await db.commit()

    return {
        "message": "Credentials created successfully",
        "username": username,
        "password": password,  # Only returned once during creation
        "employee_name": f"{employee[2]} {employee[3]}",
        "must_change_password": True
    }


@router.get("/employees/{employee_id}/credentials")
async def get_employee_credentials(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get credential status for an employee (without password)"""
    result = await db.execute(
        text("""
            SELECT
                ec.id,
                ec.username,
                ec.is_active,
                ec.last_login,
                ec.password_changed_at,
                ec.must_change_password,
                ec.failed_login_attempts,
                ec.locked_until,
                ec.created_at
            FROM employee_credentials ec
            WHERE ec.employee_id = :employee_id
        """),
        {"employee_id": str(employee_id)}
    )
    cred = result.fetchone()

    if not cred:
        return {"has_credentials": False, "message": "No credentials found"}

    return {
        "has_credentials": True,
        "id": cred[0],
        "username": cred[1],
        "is_active": cred[2],
        "last_login": cred[3].isoformat() if cred[3] else None,
        "password_changed_at": cred[4].isoformat() if cred[4] else None,
        "must_change_password": cred[5],
        "failed_login_attempts": cred[6],
        "is_locked": cred[7] is not None and cred[7] > datetime.now(),
        "locked_until": cred[7].isoformat() if cred[7] else None,
        "created_at": cred[8].isoformat() if cred[8] else None
    }


@router.put("/employees/{employee_id}/credentials/reset-password")
async def reset_employee_password(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Reset password for an employee (generates new password)"""
    # Check if credentials exist
    cred_result = await db.execute(
        text("SELECT id FROM employee_credentials WHERE employee_id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    cred = cred_result.fetchone()

    if not cred:
        raise HTTPException(status_code=404, detail="No credentials found for this employee")

    # Generate new password
    new_password = generate_password()
    password_hash = hash_password(new_password)

    # Update password
    await db.execute(
        text("""
            UPDATE employee_credentials
            SET password_hash = :password_hash,
                must_change_password = true,
                password_changed_at = NOW(),
                updated_at = NOW()
            WHERE employee_id = :employee_id
        """),
        {
            "employee_id": str(employee_id),
            "password_hash": password_hash
        }
    )
    await db.commit()

    return {
        "message": "Password reset successfully",
        "new_password": new_password,  # Only returned once
        "must_change_password": True
    }


@router.put("/employees/{employee_id}/credentials/toggle-status")
async def toggle_credential_status(
    employee_id: UUID,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate employee credentials"""
    # Check if credentials exist
    cred_result = await db.execute(
        text("SELECT id FROM employee_credentials WHERE employee_id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    cred = cred_result.fetchone()

    if not cred:
        raise HTTPException(status_code=404, detail="No credentials found for this employee")

    # Update status
    await db.execute(
        text("""
            UPDATE employee_credentials
            SET is_active = :is_active,
                updated_at = NOW()
            WHERE employee_id = :employee_id
        """),
        {
            "employee_id": str(employee_id),
            "is_active": is_active
        }
    )
    await db.commit()

    return {
        "message": f"Credentials {'activated' if is_active else 'deactivated'} successfully",
        "is_active": is_active
    }


@router.delete("/employees/{employee_id}/credentials")
async def delete_employee_credentials(
    employee_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete employee credentials"""
    # Check if credentials exist
    cred_result = await db.execute(
        text("SELECT id FROM employee_credentials WHERE employee_id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    cred = cred_result.fetchone()

    if not cred:
        raise HTTPException(status_code=404, detail="No credentials found for this employee")

    # Delete credentials
    await db.execute(
        text("DELETE FROM employee_credentials WHERE employee_id = :employee_id"),
        {"employee_id": str(employee_id)}
    )
    await db.commit()

    return {"message": "Credentials deleted successfully"}


@router.post("/auth/employee-login")
async def employee_login(
    username: str,
    password: str,
    db: AsyncSession = Depends(get_db),
):
    """Authenticate employee and return employee details"""
    password_hash = hash_password(password)

    result = await db.execute(
        text("""
            SELECT
                ec.id as cred_id,
                ec.employee_id,
                ec.is_active,
                ec.must_change_password,
                ec.failed_login_attempts,
                ec.locked_until,
                e.employee_code,
                e.first_name,
                e.last_name,
                e.work_email,
                e.job_title,
                e.department_id
            FROM employee_credentials ec
            JOIN employees e ON e.id = ec.employee_id
            WHERE ec.username = :username AND ec.password_hash = :password_hash
        """),
        {"username": username, "password_hash": password_hash}
    )
    cred = result.fetchone()

    if not cred:
        # Record failed login attempt
        await db.execute(
            text("""
                UPDATE employee_credentials
                SET failed_login_attempts = failed_login_attempts + 1,
                    locked_until = CASE
                        WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
                        ELSE locked_until
                    END
                WHERE username = :username
            """),
            {"username": username}
        )
        await db.commit()
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Check if account is locked
    if cred[5] and cred[5] > datetime.now():
        raise HTTPException(
            status_code=403,
            detail=f"Account is locked until {cred[5].isoformat()}"
        )

    # Check if account is active
    if not cred[2]:
        raise HTTPException(status_code=403, detail="Account is deactivated")

    # Update last login and reset failed attempts
    await db.execute(
        text("""
            UPDATE employee_credentials
            SET last_login = NOW(),
                failed_login_attempts = 0,
                locked_until = NULL
            WHERE id = :cred_id
        """),
        {"cred_id": cred[0]}
    )
    await db.commit()

    return {
        "success": True,
        "employee_id": cred[1],
        "employee_code": cred[6],
        "full_name": f"{cred[7]} {cred[8]}",
        "email": cred[9],
        "job_title": cred[10],
        "department_id": cred[11],
        "must_change_password": cred[3]
    }
