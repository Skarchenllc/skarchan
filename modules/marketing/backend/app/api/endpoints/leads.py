from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/leads")
async def get_leads(
    status: Optional[str] = None,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all leads with optional filters"""
    query = "SELECT * FROM leads WHERE 1=1"
    params = {}

    if status:
        query += " AND status = :status"
        params["status"] = status

    if source:
        query += " AND source = :source"
        params["source"] = source

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    leads = result.fetchall()

    return {
        "leads": [
            {
                "id": str(row[0]),
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "phone": row[4],
                "company": row[5],
                "job_title": row[6],
                "source": row[7],
                "status": row[8],
                "score": row[9] or 0,
                "campaign_id": str(row[10]) if row[10] else None,
                "city": row[11],
                "state": row[12],
                "country": row[13],
                "last_contacted": row[14] if isinstance(row[14], str) else (row[14].isoformat() if row[14] else None),
                "assigned_to": row[18],
                "created_at": row[19] if isinstance(row[19], str) else (row[19].isoformat() if row[19] else None),
            }
            for row in leads
        ],
        "total": len(leads)
    }


@router.get("/leads/{lead_id}")
async def get_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get lead by ID"""
    result = await db.execute(
        text("SELECT * FROM leads WHERE id = :id"),
        {"id": str(lead_id)}
    )
    lead = result.fetchone()

    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    return {
        "id": str(lead[0]),
        "first_name": lead[1],
        "last_name": lead[2],
        "email": lead[3],
        "phone": lead[4],
        "company": lead[5],
        "job_title": lead[6],
        "source": lead[7],
        "status": lead[8],
        "score": lead[9] or 0,
        "campaign_id": str(lead[10]) if lead[10] else None,
        "city": lead[11],
        "state": lead[12],
        "country": lead[13],
        "last_contacted": lead[14].isoformat() if lead[14] else None,
        "conversion_date": lead[15].isoformat() if lead[15] else None,
        "interests": lead[16],
        "custom_fields": lead[17],
        "notes": lead[18],
        "assigned_to": lead[19],
        "created_at": lead[20].isoformat() if lead[20] else None,
        "updated_at": lead[21].isoformat() if lead[21] else None,
    }


@router.post("/leads")
async def create_lead(
    first_name: str,
    last_name: str,
    email: str,
    phone: Optional[str] = None,
    company: Optional[str] = None,
    job_title: Optional[str] = None,
    source: Optional[str] = None,
    campaign_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new lead"""
    # Check if email already exists
    result = await db.execute(
        text("SELECT id FROM leads WHERE email = :email"),
        {"email": email}
    )
    existing = result.fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Lead with this email already exists")

    lead_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO leads (
                id, first_name, last_name, email, phone, company, job_title,
                source, status, score, campaign_id, created_at, updated_at
            ) VALUES (
                :id, :first_name, :last_name, :email, :phone, :company, :job_title,
                :source, 'new', 0, :campaign_id, NOW(), NOW()
            )
        """),
        {
            "id": str(lead_id),
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "phone": phone,
            "company": company,
            "job_title": job_title,
            "source": source,
            "campaign_id": str(campaign_id) if campaign_id else None,
        }
    )
    await db.commit()

    return {
        "message": "Lead created successfully",
        "id": str(lead_id),
        "email": email
    }


@router.put("/leads/{lead_id}")
async def update_lead(
    lead_id: UUID,
    status: Optional[str] = None,
    score: Optional[int] = None,
    notes: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update lead"""
    updates = []
    params = {"id": str(lead_id)}

    if status:
        updates.append("status = :status")
        params["status"] = status

    if score is not None:
        updates.append("score = :score")
        params["score"] = score

    if notes is not None:
        updates.append("notes = :notes")
        params["notes"] = notes

    if assigned_to:
        updates.append("assigned_to = :assigned_to")
        params["assigned_to"] = assigned_to

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE leads SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Lead updated successfully"}


@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete lead"""
    await db.execute(
        text("DELETE FROM leads WHERE id = :id"),
        {"id": str(lead_id)}
    )
    await db.commit()

    return {"message": "Lead deleted successfully"}


@router.get("/leads/{lead_id}/activities")
async def get_lead_activities(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get lead activities"""
    result = await db.execute(
        text("""
            SELECT * FROM lead_activities
            WHERE lead_id = :lead_id
            ORDER BY activity_date DESC
        """),
        {"lead_id": str(lead_id)}
    )
    activities = result.fetchall()

    return {
        "activities": [
            {
                "id": str(row[0]),
                "activity_type": row[2],
                "activity_date": row[3].isoformat() if row[3] else None,
                "description": row[4],
                "metadata": row[5],
                "created_by": row[6],
            }
            for row in activities
        ]
    }


@router.get("/leads/stats/overview")
async def get_leads_overview(db: AsyncSession = Depends(get_db)):
    """Get overall lead statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_leads,
                COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads,
                COUNT(CASE WHEN status = 'qualified' THEN 1 END) as qualified_leads,
                COUNT(CASE WHEN status = 'converted' THEN 1 END) as converted_leads,
                AVG(score) as avg_score
            FROM leads
        """)
    )
    stats = result.fetchone()

    return {
        "total_leads": stats[0] or 0,
        "new_leads": stats[1] or 0,
        "qualified_leads": stats[2] or 0,
        "converted_leads": stats[3] or 0,
        "avg_score": float(stats[4]) if stats[4] else 0.0,
    }
