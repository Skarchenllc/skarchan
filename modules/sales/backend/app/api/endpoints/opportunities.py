from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from datetime import datetime, date
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db

router = APIRouter()


@router.get("/opportunities")
async def get_opportunities(
    stage: Optional[str] = None,
    is_won: Optional[str] = None,
    customer_id: Optional[UUID] = None,
    assigned_to: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all opportunities with optional filters"""
    query = "SELECT * FROM opportunities WHERE 1=1"
    params = {}

    if stage:
        query += " AND stage = :stage"
        params["stage"] = stage

    if is_won:
        query += " AND is_won = :is_won"
        params["is_won"] = is_won

    if customer_id:
        query += " AND customer_id = :customer_id"
        params["customer_id"] = str(customer_id)

    if assigned_to:
        query += " AND assigned_to = :assigned_to"
        params["assigned_to"] = assigned_to

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    opportunities = result.fetchall()

    return {
        "opportunities": [
            {
                "id": str(row[0]),
                "opportunity_name": row[1],
                "opportunity_code": row[2],
                "customer_id": str(row[3]),
                "stage": row[4],
                "probability": row[5] or 0,
                "amount": float(row[6]) if row[6] else 0.0,
                "expected_close_date": row[7].isoformat() if row[7] else None,
                "source": row[9],
                "opportunity_type": row[10],
                "assigned_to": row[11],
                "is_won": row[16],
                "created_at": row[20].isoformat() if row[20] else None,
            }
            for row in opportunities
        ],
        "total": len(opportunities)
    }


@router.get("/opportunities/{opportunity_id}")
async def get_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get opportunity by ID"""
    result = await db.execute(
        text("SELECT * FROM opportunities WHERE id = :id"),
        {"id": str(opportunity_id)}
    )
    opportunity = result.fetchone()

    if not opportunity:
        raise HTTPException(status_code=404, detail="Opportunity not found")

    return {
        "id": str(opportunity[0]),
        "opportunity_name": opportunity[1],
        "opportunity_code": opportunity[2],
        "customer_id": str(opportunity[3]),
        "stage": opportunity[4],
        "probability": opportunity[5] or 0,
        "amount": float(opportunity[6]) if opportunity[6] else 0.0,
        "expected_close_date": opportunity[7].isoformat() if opportunity[7] else None,
        "actual_close_date": opportunity[8].isoformat() if opportunity[8] else None,
        "source": opportunity[9],
        "opportunity_type": opportunity[10],
        "assigned_to": opportunity[11],
        "next_step": opportunity[12],
        "description": opportunity[13],
        "competitors": opportunity[14],
        "products": opportunity[15],
        "is_won": opportunity[16],
        "loss_reason": opportunity[17],
        "notes": opportunity[18],
        "created_by": opportunity[19],
        "created_at": opportunity[20].isoformat() if opportunity[20] else None,
        "updated_at": opportunity[21].isoformat() if opportunity[21] else None,
    }


@router.post("/opportunities")
async def create_opportunity(
    opportunity_name: str,
    opportunity_code: str,
    customer_id: UUID,
    amount: float,
    stage: Optional[str] = "prospecting",
    probability: Optional[int] = 0,
    expected_close_date: Optional[date] = None,
    source: Optional[str] = None,
    opportunity_type: Optional[str] = "new_business",
    assigned_to: Optional[str] = None,
    next_step: Optional[str] = None,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new opportunity"""
    opportunity_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO opportunities (
                id, opportunity_name, opportunity_code, customer_id,
                stage, probability, amount, expected_close_date,
                source, opportunity_type, assigned_to, next_step, description,
                is_won, created_at, updated_at
            ) VALUES (
                :id, :opportunity_name, :opportunity_code, :customer_id,
                :stage, :probability, :amount, :expected_close_date,
                :source, :opportunity_type, :assigned_to, :next_step, :description,
                'open', NOW(), NOW()
            )
        """),
        {
            "id": str(opportunity_id),
            "opportunity_name": opportunity_name,
            "opportunity_code": opportunity_code,
            "customer_id": str(customer_id),
            "stage": stage,
            "probability": probability,
            "amount": amount,
            "expected_close_date": expected_close_date,
            "source": source,
            "opportunity_type": opportunity_type,
            "assigned_to": assigned_to,
            "next_step": next_step,
            "description": description,
        }
    )
    await db.commit()

    return {
        "message": "Opportunity created successfully",
        "id": str(opportunity_id),
        "opportunity_code": opportunity_code
    }


@router.put("/opportunities/{opportunity_id}")
async def update_opportunity(
    opportunity_id: UUID,
    opportunity_name: Optional[str] = None,
    stage: Optional[str] = None,
    probability: Optional[int] = None,
    amount: Optional[float] = None,
    expected_close_date: Optional[date] = None,
    actual_close_date: Optional[date] = None,
    assigned_to: Optional[str] = None,
    next_step: Optional[str] = None,
    description: Optional[str] = None,
    is_won: Optional[str] = None,
    loss_reason: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update opportunity"""
    updates = []
    params = {"id": str(opportunity_id)}

    if opportunity_name:
        updates.append("opportunity_name = :opportunity_name")
        params["opportunity_name"] = opportunity_name

    if stage:
        updates.append("stage = :stage")
        params["stage"] = stage

    if probability is not None:
        updates.append("probability = :probability")
        params["probability"] = probability

    if amount is not None:
        updates.append("amount = :amount")
        params["amount"] = amount

    if expected_close_date is not None:
        updates.append("expected_close_date = :expected_close_date")
        params["expected_close_date"] = expected_close_date

    if actual_close_date is not None:
        updates.append("actual_close_date = :actual_close_date")
        params["actual_close_date"] = actual_close_date

    if assigned_to is not None:
        updates.append("assigned_to = :assigned_to")
        params["assigned_to"] = assigned_to

    if next_step is not None:
        updates.append("next_step = :next_step")
        params["next_step"] = next_step

    if description is not None:
        updates.append("description = :description")
        params["description"] = description

    if is_won is not None:
        updates.append("is_won = :is_won")
        params["is_won"] = is_won

    if loss_reason is not None:
        updates.append("loss_reason = :loss_reason")
        params["loss_reason"] = loss_reason

    if notes is not None:
        updates.append("notes = :notes")
        params["notes"] = notes

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE opportunities SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Opportunity updated successfully"}


@router.delete("/opportunities/{opportunity_id}")
async def delete_opportunity(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete opportunity"""
    await db.execute(
        text("DELETE FROM opportunities WHERE id = :id"),
        {"id": str(opportunity_id)}
    )
    await db.commit()

    return {"message": "Opportunity deleted successfully"}


@router.get("/opportunities/{opportunity_id}/activities")
async def get_opportunity_activities(
    opportunity_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get opportunity activities"""
    result = await db.execute(
        text("""
            SELECT * FROM opportunity_activities
            WHERE opportunity_id = :opportunity_id
            ORDER BY activity_date DESC
        """),
        {"opportunity_id": str(opportunity_id)}
    )
    activities = result.fetchall()

    return {
        "activities": [
            {
                "id": str(row[0]),
                "activity_type": row[2],
                "activity_date": row[3].isoformat() if row[3] else None,
                "subject": row[4],
                "description": row[5],
                "outcome": row[6],
                "created_by": row[7],
            }
            for row in activities
        ]
    }


@router.get("/opportunities/stats/overview")
async def get_opportunities_overview(db: AsyncSession = Depends(get_db)):
    """Get overall opportunity statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_opportunities,
                COUNT(CASE WHEN is_won = 'open' THEN 1 END) as open_opportunities,
                COUNT(CASE WHEN is_won = 'won' THEN 1 END) as won_opportunities,
                COUNT(CASE WHEN is_won = 'lost' THEN 1 END) as lost_opportunities,
                SUM(amount) as total_pipeline_value,
                SUM(CASE WHEN is_won = 'won' THEN amount ELSE 0 END) as total_won_value,
                AVG(probability) as avg_win_probability,
                SUM(CASE WHEN is_won = 'open' THEN amount ELSE 0 END) as open_pipeline_value
            FROM opportunities
        """)
    )
    stats = result.fetchone()

    # Calculate win rate
    total_closed = (stats[2] or 0) + (stats[3] or 0)
    win_rate = (stats[2] / total_closed * 100) if total_closed > 0 else 0

    return {
        "total_opportunities": stats[0] or 0,
        "open_opportunities": stats[1] or 0,
        "won_opportunities": stats[2] or 0,
        "lost_opportunities": stats[3] or 0,
        "total_pipeline_value": float(stats[4]) if stats[4] else 0.0,
        "total_won_value": float(stats[5]) if stats[5] else 0.0,
        "average_win_probability": float(stats[6]) if stats[6] else 0.0,
        "open_pipeline_value": float(stats[7]) if stats[7] else 0.0,
        "win_rate_percentage": round(win_rate, 2),
    }
