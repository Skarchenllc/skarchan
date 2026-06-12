from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid
import json

router = APIRouter(prefix="/compliance-policies", tags=["compliance-policies"])


@router.get("")
async def list_compliance_policies(
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all compliance policies with optional filters."""
    query = "SELECT * FROM compliance_policies WHERE 1=1"
    params = {}

    if category:
        query += " AND category = :category"
        params["category"] = category

    if status:
        query += " AND status = :status"
        params["status"] = status

    if search:
        query += " AND (policy_code ILIKE :search OR policy_name ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    policies = result.mappings().all()

    return {
        "compliance_policies": [dict(row) for row in policies],
        "total": len(policies)
    }


@router.get("/stats/overview")
async def get_compliance_policies_stats(db: AsyncSession = Depends(get_db)):
    """Get compliance policies statistics overview."""
    # Total policies
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_policies"))
    total_policies = total_result.scalar()

    # Active policies
    active_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_policies WHERE status = 'active'"))
    active_policies = active_result.scalar()

    # Policies under review
    review_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_policies WHERE status = 'under_review'"))
    under_review = review_result.scalar()

    # Policies expiring soon (within 30 days)
    expiring_result = await db.execute(text("""
        SELECT COUNT(*) as count FROM compliance_policies
        WHERE expiry_date IS NOT NULL
        AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'
        AND status = 'active'
    """))
    expiring_soon = expiring_result.scalar()

    return {
        "total_policies": total_policies,
        "active_policies": active_policies,
        "under_review": under_review,
        "expiring_soon": expiring_soon
    }


@router.get("/{policy_id}")
async def get_compliance_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    """Get compliance policy details by ID."""
    query = text("SELECT * FROM compliance_policies WHERE id = :policy_id")
    result = await db.execute(query, {"policy_id": policy_id})
    policy = result.mappings().first()

    if not policy:
        raise HTTPException(status_code=404, detail="Compliance policy not found")

    return {"compliance_policy": dict(policy)}


@router.post("")
async def create_compliance_policy(policy_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new compliance policy."""
    policy_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO compliance_policies (
            id, policy_code, policy_name, category, version, status,
            effective_date, review_date, expiry_date, owner, approver,
            description, policy_document_url, scope
        ) VALUES (
            :id, :policy_code, :policy_name, :category, :version, :status,
            :effective_date, :review_date, :expiry_date, :owner, :approver,
            :description, :policy_document_url, CAST(:scope AS jsonb)
        )
        RETURNING *
    """)

    params = {
        "id": policy_id,
        "policy_code": policy_data.get("policy_code"),
        "policy_name": policy_data.get("policy_name"),
        "category": policy_data.get("category"),
        "version": policy_data.get("version"),
        "status": policy_data.get("status", "draft"),
        "effective_date": policy_data.get("effective_date"),
        "review_date": policy_data.get("review_date"),
        "expiry_date": policy_data.get("expiry_date"),
        "owner": policy_data.get("owner"),
        "approver": policy_data.get("approver"),
        "description": policy_data.get("description"),
        "policy_document_url": policy_data.get("policy_document_url"),
        "scope": json.dumps(policy_data.get("scope", {}))
    }

    result = await db.execute(query, params)
    await db.commit()
    policy = result.mappings().first()

    return {"compliance_policy": dict(policy), "message": "Compliance policy created successfully"}


@router.put("/{policy_id}")
async def update_compliance_policy(policy_id: str, policy_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing compliance policy."""
    # Build dynamic update query
    update_fields = []
    params = {"policy_id": policy_id}

    for key, value in policy_data.items():
        if key != "id" and key != "created_at":
            if key == "scope":
                update_fields.append(f"{key} = CAST(:{key} AS jsonb)")
                params[key] = json.dumps(value) if value else "{}"
            else:
                update_fields.append(f"{key} = :{key}")
                params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE compliance_policies
        SET {', '.join(update_fields)}
        WHERE id = :policy_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    policy = result.mappings().first()

    if not policy:
        raise HTTPException(status_code=404, detail="Compliance policy not found")

    return {"compliance_policy": dict(policy), "message": "Compliance policy updated successfully"}


@router.delete("/{policy_id}")
async def delete_compliance_policy(policy_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a compliance policy."""
    query = text("DELETE FROM compliance_policies WHERE id = :policy_id RETURNING id")
    result = await db.execute(query, {"policy_id": policy_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Compliance policy not found")

    return {"message": "Compliance policy deleted successfully", "id": str(deleted["id"])}
