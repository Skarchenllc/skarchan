from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid
import json

router = APIRouter(prefix="/strategic-initiatives", tags=["strategic-initiatives"])


@router.get("")
async def list_strategic_initiatives(
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all strategic initiatives with optional filters."""
    query = "SELECT * FROM strategic_initiatives WHERE 1=1"
    params = {}

    if category:
        query += " AND category = :category"
        params["category"] = category

    if status:
        query += " AND status = :status"
        params["status"] = status

    if priority:
        query += " AND priority = :priority"
        params["priority"] = priority

    if search:
        query += " AND (initiative_code ILIKE :search OR initiative_name ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    initiatives = result.mappings().all()

    return {
        "strategic_initiatives": [dict(row) for row in initiatives],
        "total": len(initiatives)
    }


@router.get("/stats/overview")
async def get_strategic_initiatives_stats(db: AsyncSession = Depends(get_db)):
    """Get strategic initiatives statistics overview."""
    # Total initiatives
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM strategic_initiatives"))
    total_initiatives = total_result.scalar()

    # Active initiatives
    active_result = await db.execute(text("SELECT COUNT(*) as count FROM strategic_initiatives WHERE status IN ('approved', 'in_progress')"))
    active_initiatives = active_result.scalar()

    # Completed initiatives
    completed_result = await db.execute(text("SELECT COUNT(*) as count FROM strategic_initiatives WHERE status = 'completed'"))
    completed_initiatives = completed_result.scalar()

    # Total budget allocated
    budget_result = await db.execute(text("SELECT COALESCE(SUM(budget_allocated), 0) as total_budget FROM strategic_initiatives WHERE status IN ('approved', 'in_progress')"))
    total_budget = float(budget_result.scalar() or 0)

    # Total budget spent
    spent_result = await db.execute(text("SELECT COALESCE(SUM(budget_spent), 0) as total_spent FROM strategic_initiatives WHERE status IN ('approved', 'in_progress', 'completed')"))
    total_spent = float(spent_result.scalar() or 0)

    # Average progress
    progress_result = await db.execute(text("SELECT COALESCE(AVG(progress_percentage), 0) as avg_progress FROM strategic_initiatives WHERE status = 'in_progress'"))
    avg_progress = float(progress_result.scalar() or 0)

    return {
        "total_initiatives": total_initiatives,
        "active_initiatives": active_initiatives,
        "completed_initiatives": completed_initiatives,
        "total_budget_allocated": round(total_budget, 2),
        "total_budget_spent": round(total_spent, 2),
        "average_progress": round(avg_progress, 2)
    }


@router.get("/{initiative_id}")
async def get_strategic_initiative(initiative_id: str, db: AsyncSession = Depends(get_db)):
    """Get strategic initiative details by ID."""
    query = text("SELECT * FROM strategic_initiatives WHERE id = :initiative_id")
    result = await db.execute(query, {"initiative_id": initiative_id})
    initiative = result.mappings().first()

    if not initiative:
        raise HTTPException(status_code=404, detail="Strategic initiative not found")

    return {"strategic_initiative": dict(initiative)}


@router.post("")
async def create_strategic_initiative(initiative_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new strategic initiative."""
    initiative_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO strategic_initiatives (
            id, initiative_code, initiative_name, category, status, priority,
            owner, champion, start_date, target_completion_date, actual_completion_date,
            budget_allocated, budget_spent, progress_percentage, objectives,
            kpis, milestones, risks, description
        ) VALUES (
            :id, :initiative_code, :initiative_name, :category, :status, :priority,
            :owner, :champion, :start_date, :target_completion_date, :actual_completion_date,
            :budget_allocated, :budget_spent, :progress_percentage, CAST(:objectives AS jsonb),
            CAST(:kpis AS jsonb), CAST(:milestones AS jsonb), CAST(:risks AS jsonb), :description
        )
        RETURNING *
    """)

    params = {
        "id": initiative_id,
        "initiative_code": initiative_data.get("initiative_code"),
        "initiative_name": initiative_data.get("initiative_name"),
        "category": initiative_data.get("category"),
        "status": initiative_data.get("status", "proposed"),
        "priority": initiative_data.get("priority", "medium"),
        "owner": initiative_data.get("owner"),
        "champion": initiative_data.get("champion"),
        "start_date": initiative_data.get("start_date"),
        "target_completion_date": initiative_data.get("target_completion_date"),
        "actual_completion_date": initiative_data.get("actual_completion_date"),
        "budget_allocated": initiative_data.get("budget_allocated"),
        "budget_spent": initiative_data.get("budget_spent", 0),
        "progress_percentage": initiative_data.get("progress_percentage", 0),
        "objectives": json.dumps(initiative_data.get("objectives", [])),
        "kpis": json.dumps(initiative_data.get("kpis", [])),
        "milestones": json.dumps(initiative_data.get("milestones", [])),
        "risks": json.dumps(initiative_data.get("risks", [])),
        "description": initiative_data.get("description")
    }

    result = await db.execute(query, params)
    await db.commit()
    initiative = result.mappings().first()

    return {"strategic_initiative": dict(initiative), "message": "Strategic initiative created successfully"}


@router.put("/{initiative_id}")
async def update_strategic_initiative(initiative_id: str, initiative_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing strategic initiative."""
    # Build dynamic update query
    update_fields = []
    params = {"initiative_id": initiative_id}

    for key, value in initiative_data.items():
        if key != "id" and key != "created_at":
            if key in ["objectives", "kpis", "milestones", "risks"]:
                update_fields.append(f"{key} = CAST(:{key} AS jsonb)")
                params[key] = json.dumps(value) if value else "[]"
            else:
                update_fields.append(f"{key} = :{key}")
                params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE strategic_initiatives
        SET {', '.join(update_fields)}
        WHERE id = :initiative_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    initiative = result.mappings().first()

    if not initiative:
        raise HTTPException(status_code=404, detail="Strategic initiative not found")

    return {"strategic_initiative": dict(initiative), "message": "Strategic initiative updated successfully"}


@router.delete("/{initiative_id}")
async def delete_strategic_initiative(initiative_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a strategic initiative."""
    query = text("DELETE FROM strategic_initiatives WHERE id = :initiative_id RETURNING id")
    result = await db.execute(query, {"initiative_id": initiative_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Strategic initiative not found")

    return {"message": "Strategic initiative deleted successfully", "id": str(deleted["id"])}
