from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid
import json

router = APIRouter(prefix="/legal-cases", tags=["legal-cases"])


@router.get("")
async def list_legal_cases(
    case_type: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all legal cases with optional filters."""
    query = "SELECT * FROM legal_cases WHERE 1=1"
    params = {}

    if case_type:
        query += " AND case_type = :case_type"
        params["case_type"] = case_type

    if status:
        query += " AND status = :status"
        params["status"] = status

    if priority:
        query += " AND priority = :priority"
        params["priority"] = priority

    if search:
        query += " AND (case_number ILIKE :search OR case_title ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    cases = result.mappings().all()

    return {
        "legal_cases": [dict(row) for row in cases],
        "total": len(cases)
    }


@router.get("/stats/overview")
async def get_legal_cases_stats(db: AsyncSession = Depends(get_db)):
    """Get legal cases statistics overview."""
    # Total cases
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM legal_cases"))
    total_cases = total_result.scalar()

    # Open cases
    open_result = await db.execute(text("SELECT COUNT(*) as count FROM legal_cases WHERE status IN ('open', 'in_progress')"))
    open_cases = open_result.scalar()

    # Closed cases
    closed_result = await db.execute(text("SELECT COUNT(*) as count FROM legal_cases WHERE status = 'closed'"))
    closed_cases = closed_result.scalar()

    # Total case value
    value_result = await db.execute(text("SELECT COALESCE(SUM(case_value), 0) as total_value FROM legal_cases WHERE status IN ('open', 'in_progress')"))
    total_case_value = float(value_result.scalar() or 0)

    return {
        "total_cases": total_cases,
        "open_cases": open_cases,
        "closed_cases": closed_cases,
        "total_case_value": round(total_case_value, 2)
    }


@router.get("/{case_id}")
async def get_legal_case(case_id: str, db: AsyncSession = Depends(get_db)):
    """Get legal case details by ID."""
    query = text("SELECT * FROM legal_cases WHERE id = :case_id")
    result = await db.execute(query, {"case_id": case_id})
    case = result.mappings().first()

    if not case:
        raise HTTPException(status_code=404, detail="Legal case not found")

    return {"legal_case": dict(case)}


@router.post("")
async def create_legal_case(case_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new legal case."""
    case_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO legal_cases (
            id, case_number, case_title, case_type, status, priority,
            plaintiff, defendant, court_name, assigned_counsel, external_counsel,
            case_value, filing_date, hearing_date, resolution_date, outcome,
            description, documents
        ) VALUES (
            :id, :case_number, :case_title, :case_type, :status, :priority,
            :plaintiff, :defendant, :court_name, :assigned_counsel, :external_counsel,
            :case_value, :filing_date, :hearing_date, :resolution_date, :outcome,
            :description, CAST(:documents AS jsonb)
        )
        RETURNING *
    """)

    params = {
        "id": case_id,
        "case_number": case_data.get("case_number"),
        "case_title": case_data.get("case_title"),
        "case_type": case_data.get("case_type"),
        "status": case_data.get("status", "open"),
        "priority": case_data.get("priority", "medium"),
        "plaintiff": case_data.get("plaintiff"),
        "defendant": case_data.get("defendant"),
        "court_name": case_data.get("court_name"),
        "assigned_counsel": case_data.get("assigned_counsel"),
        "external_counsel": case_data.get("external_counsel"),
        "case_value": case_data.get("case_value"),
        "filing_date": case_data.get("filing_date"),
        "hearing_date": case_data.get("hearing_date"),
        "resolution_date": case_data.get("resolution_date"),
        "outcome": case_data.get("outcome"),
        "description": case_data.get("description"),
        "documents": json.dumps(case_data.get("documents", []))
    }

    result = await db.execute(query, params)
    await db.commit()
    case = result.mappings().first()

    return {"legal_case": dict(case), "message": "Legal case created successfully"}


@router.put("/{case_id}")
async def update_legal_case(case_id: str, case_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing legal case."""
    # Build dynamic update query
    update_fields = []
    params = {"case_id": case_id}

    for key, value in case_data.items():
        if key != "id" and key != "created_at":
            if key == "documents":
                update_fields.append(f"{key} = CAST(:{key} AS jsonb)")
                params[key] = json.dumps(value) if value else "[]"
            else:
                update_fields.append(f"{key} = :{key}")
                params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE legal_cases
        SET {', '.join(update_fields)}
        WHERE id = :case_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    case = result.mappings().first()

    if not case:
        raise HTTPException(status_code=404, detail="Legal case not found")

    return {"legal_case": dict(case), "message": "Legal case updated successfully"}


@router.delete("/{case_id}")
async def delete_legal_case(case_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a legal case."""
    query = text("DELETE FROM legal_cases WHERE id = :case_id RETURNING id")
    result = await db.execute(query, {"case_id": case_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Legal case not found")

    return {"message": "Legal case deleted successfully", "id": str(deleted["id"])}
