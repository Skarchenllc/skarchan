from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid
import json

router = APIRouter(prefix="/compliance-audits", tags=["compliance-audits"])


@router.get("")
async def list_compliance_audits(
    audit_type: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all compliance audits with optional filters."""
    query = "SELECT * FROM compliance_audits WHERE 1=1"
    params = {}

    if audit_type:
        query += " AND audit_type = :audit_type"
        params["audit_type"] = audit_type

    if status:
        query += " AND status = :status"
        params["status"] = status

    if risk_level:
        query += " AND risk_level = :risk_level"
        params["risk_level"] = risk_level

    if search:
        query += " AND (audit_number ILIKE :search OR audit_title ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    audits = result.mappings().all()

    return {
        "compliance_audits": [dict(row) for row in audits],
        "total": len(audits)
    }


@router.get("/stats/overview")
async def get_compliance_audits_stats(db: AsyncSession = Depends(get_db)):
    """Get compliance audits statistics overview."""
    # Total audits
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_audits"))
    total_audits = total_result.scalar()

    # Completed audits
    completed_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_audits WHERE status = 'completed'"))
    completed_audits = completed_result.scalar()

    # In-progress audits
    in_progress_result = await db.execute(text("SELECT COUNT(*) as count FROM compliance_audits WHERE status = 'in_progress'"))
    in_progress_audits = in_progress_result.scalar()

    # Average audit score
    score_result = await db.execute(text("""
        SELECT COALESCE(AVG(score), 0) as avg_score
        FROM compliance_audits
        WHERE status = 'completed' AND score IS NOT NULL
    """))
    avg_score = float(score_result.scalar() or 0)

    return {
        "total_audits": total_audits,
        "completed_audits": completed_audits,
        "in_progress_audits": in_progress_audits,
        "average_score": round(avg_score, 2)
    }


@router.get("/{audit_id}")
async def get_compliance_audit(audit_id: str, db: AsyncSession = Depends(get_db)):
    """Get compliance audit details by ID."""
    query = text("SELECT * FROM compliance_audits WHERE id = :audit_id")
    result = await db.execute(query, {"audit_id": audit_id})
    audit = result.mappings().first()

    if not audit:
        raise HTTPException(status_code=404, detail="Compliance audit not found")

    return {"compliance_audit": dict(audit)}


@router.post("")
async def create_compliance_audit(audit_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new compliance audit."""
    audit_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO compliance_audits (
            id, audit_number, audit_title, audit_type, policy_id, status,
            risk_level, auditor_name, audit_date, completion_date, findings,
            recommendations, action_items, score
        ) VALUES (
            :id, :audit_number, :audit_title, :audit_type, CAST(:policy_id AS uuid), :status,
            :risk_level, :auditor_name, :audit_date, :completion_date, CAST(:findings AS jsonb),
            :recommendations, CAST(:action_items AS jsonb), :score
        )
        RETURNING *
    """)

    params = {
        "id": audit_id,
        "audit_number": audit_data.get("audit_number"),
        "audit_title": audit_data.get("audit_title"),
        "audit_type": audit_data.get("audit_type"),
        "policy_id": audit_data.get("policy_id"),
        "status": audit_data.get("status", "scheduled"),
        "risk_level": audit_data.get("risk_level", "medium"),
        "auditor_name": audit_data.get("auditor_name"),
        "audit_date": audit_data.get("audit_date"),
        "completion_date": audit_data.get("completion_date"),
        "findings": json.dumps(audit_data.get("findings", [])),
        "recommendations": audit_data.get("recommendations"),
        "action_items": json.dumps(audit_data.get("action_items", [])),
        "score": audit_data.get("score")
    }

    result = await db.execute(query, params)
    await db.commit()
    audit = result.mappings().first()

    return {"compliance_audit": dict(audit), "message": "Compliance audit created successfully"}


@router.put("/{audit_id}")
async def update_compliance_audit(audit_id: str, audit_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing compliance audit."""
    # Build dynamic update query
    update_fields = []
    params = {"audit_id": audit_id}

    for key, value in audit_data.items():
        if key != "id" and key != "created_at":
            if key == "policy_id" and value:
                update_fields.append(f"{key} = CAST(:{key} AS uuid)")
                params[key] = value
            elif key in ["findings", "action_items"]:
                update_fields.append(f"{key} = CAST(:{key} AS jsonb)")
                params[key] = json.dumps(value) if value else "[]"
            else:
                update_fields.append(f"{key} = :{key}")
                params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE compliance_audits
        SET {', '.join(update_fields)}
        WHERE id = :audit_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    audit = result.mappings().first()

    if not audit:
        raise HTTPException(status_code=404, detail="Compliance audit not found")

    return {"compliance_audit": dict(audit), "message": "Compliance audit updated successfully"}


@router.delete("/{audit_id}")
async def delete_compliance_audit(audit_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a compliance audit."""
    query = text("DELETE FROM compliance_audits WHERE id = :audit_id RETURNING id")
    result = await db.execute(query, {"audit_id": audit_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Compliance audit not found")

    return {"message": "Compliance audit deleted successfully", "id": str(deleted["id"])}
