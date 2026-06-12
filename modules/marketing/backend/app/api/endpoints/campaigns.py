from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
import uuid as uuid_lib

from app.core.database import get_db
from app.models.campaign import Campaign, CampaignActivity

router = APIRouter()


@router.get("/campaigns")
async def get_campaigns(
    status: Optional[str] = None,
    campaign_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all campaigns with optional filters"""
    query = "SELECT * FROM campaigns WHERE 1=1"
    params = {}

    if status:
        query += " AND status = :status"
        params["status"] = status

    if campaign_type:
        query += " AND campaign_type = :campaign_type"
        params["campaign_type"] = campaign_type

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    campaigns = result.fetchall()

    return {
        "campaigns": [
            {
                "id": str(row[0]),
                "campaign_name": row[1],
                "campaign_code": row[2],
                "campaign_type": row[3],
                "status": row[4],
                "start_date": row[5].isoformat() if row[5] else None,
                "end_date": row[6].isoformat() if row[6] else None,
                "description": row[7],
                "budget": float(row[10]) if row[10] else 0.0,
                "budget_spent": float(row[11]) if row[11] else 0.0,
                "impressions": row[12] or 0,
                "clicks": row[13] or 0,
                "conversions": row[14] or 0,
                "leads_generated": row[15] or 0,
                "created_at": row[18].isoformat() if row[18] else None,
            }
            for row in campaigns
        ],
        "total": len(campaigns)
    }


@router.get("/campaigns/{campaign_id}")
async def get_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get campaign by ID"""
    result = await db.execute(
        text("SELECT * FROM campaigns WHERE id = :id"),
        {"id": str(campaign_id)}
    )
    campaign = result.fetchone()

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    return {
        "id": str(campaign[0]),
        "campaign_name": campaign[1],
        "campaign_code": campaign[2],
        "campaign_type": campaign[3],
        "status": campaign[4],
        "start_date": campaign[5].isoformat() if campaign[5] else None,
        "end_date": campaign[6].isoformat() if campaign[6] else None,
        "description": campaign[7],
        "target_audience": campaign[8],
        "goals": campaign[9],
        "budget": float(campaign[10]) if campaign[10] else 0.0,
        "budget_spent": float(campaign[11]) if campaign[11] else 0.0,
        "impressions": campaign[12] or 0,
        "clicks": campaign[13] or 0,
        "conversions": campaign[14] or 0,
        "leads_generated": campaign[15] or 0,
        "settings": campaign[16],
        "created_by": campaign[17],
        "created_at": campaign[18].isoformat() if campaign[18] else None,
        "updated_at": campaign[19].isoformat() if campaign[19] else None,
    }


@router.post("/campaigns")
async def create_campaign(
    campaign_name: str,
    campaign_code: str,
    campaign_type: str,
    description: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    budget: Optional[float] = 0.0,
    target_audience: Optional[str] = None,
    goals: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Create a new campaign"""
    campaign_id = uuid_lib.uuid4()

    await db.execute(
        text("""
            INSERT INTO campaigns (
                id, campaign_name, campaign_code, campaign_type, status,
                start_date, end_date, description, target_audience, goals,
                budget, budget_spent, impressions, clicks, conversions, leads_generated,
                created_at, updated_at
            ) VALUES (
                :id, :campaign_name, :campaign_code, :campaign_type, 'draft',
                :start_date, :end_date, :description, :target_audience, :goals,
                :budget, 0, 0, 0, 0, 0,
                NOW(), NOW()
            )
        """),
        {
            "id": str(campaign_id),
            "campaign_name": campaign_name,
            "campaign_code": campaign_code,
            "campaign_type": campaign_type,
            "start_date": start_date,
            "end_date": end_date,
            "description": description,
            "target_audience": target_audience,
            "goals": goals,
            "budget": budget,
        }
    )
    await db.commit()

    return {
        "message": "Campaign created successfully",
        "id": str(campaign_id),
        "campaign_code": campaign_code
    }


@router.put("/campaigns/{campaign_id}")
async def update_campaign(
    campaign_id: UUID,
    campaign_name: Optional[str] = None,
    status: Optional[str] = None,
    description: Optional[str] = None,
    budget: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
):
    """Update campaign"""
    updates = []
    params = {"id": str(campaign_id)}

    if campaign_name:
        updates.append("campaign_name = :campaign_name")
        params["campaign_name"] = campaign_name

    if status:
        updates.append("status = :status")
        params["status"] = status

    if description is not None:
        updates.append("description = :description")
        params["description"] = description

    if budget is not None:
        updates.append("budget = :budget")
        params["budget"] = budget

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    updates.append("updated_at = NOW()")
    query = f"UPDATE campaigns SET {', '.join(updates)} WHERE id = :id"

    await db.execute(text(query), params)
    await db.commit()

    return {"message": "Campaign updated successfully"}


@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete campaign"""
    await db.execute(
        text("DELETE FROM campaigns WHERE id = :id"),
        {"id": str(campaign_id)}
    )
    await db.commit()

    return {"message": "Campaign deleted successfully"}


@router.get("/campaigns/{campaign_id}/activities")
async def get_campaign_activities(
    campaign_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get campaign activities"""
    result = await db.execute(
        text("""
            SELECT * FROM campaign_activities
            WHERE campaign_id = :campaign_id
            ORDER BY activity_date DESC
        """),
        {"campaign_id": str(campaign_id)}
    )
    activities = result.fetchall()

    return {
        "activities": [
            {
                "id": str(row[0]),
                "activity_type": row[2],
                "activity_date": row[3].isoformat() if row[3] else None,
                "description": row[4],
                "metrics": row[5],
            }
            for row in activities
        ]
    }


@router.get("/campaigns/stats/overview")
async def get_campaigns_overview(db: AsyncSession = Depends(get_db)):
    """Get overall campaign statistics"""
    result = await db.execute(
        text("""
            SELECT
                COUNT(*) as total_campaigns,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_campaigns,
                SUM(budget) as total_budget,
                SUM(budget_spent) as total_spent,
                SUM(leads_generated) as total_leads,
                SUM(conversions) as total_conversions
            FROM campaigns
        """)
    )
    stats = result.fetchone()

    return {
        "total_campaigns": stats[0] or 0,
        "active_campaigns": stats[1] or 0,
        "total_budget": float(stats[2]) if stats[2] else 0.0,
        "total_spent": float(stats[3]) if stats[3] else 0.0,
        "total_leads": stats[4] or 0,
        "total_conversions": stats[5] or 0,
    }
