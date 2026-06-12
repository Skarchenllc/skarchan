from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid

router = APIRouter(prefix="/production-lines", tags=["production-lines"])


@router.get("")
async def list_production_lines(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all production lines with optional filters."""
    query = """
        SELECT pl.*, wo.work_order_number
        FROM production_lines pl
        LEFT JOIN work_orders wo ON pl.current_work_order_id = wo.id
        WHERE 1=1
    """
    params = {}

    if status:
        query += " AND pl.status = :status"
        params["status"] = status

    query += " ORDER BY pl.created_at DESC"

    result = await db.execute(text(query), params)
    production_lines = result.mappings().all()

    return {
        "production_lines": [dict(row) for row in production_lines],
        "total": len(production_lines)
    }


@router.get("/stats/overview")
async def get_production_line_stats(db: AsyncSession = Depends(get_db)):
    """Get production line statistics overview."""
    # Total production lines
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM production_lines"))
    total_lines = total_result.scalar()

    # Operational lines
    operational_result = await db.execute(text("SELECT COUNT(*) as count FROM production_lines WHERE status = 'operational'"))
    operational_lines = operational_result.scalar()

    # Lines requiring maintenance (next maintenance date is in the past or within 7 days)
    maintenance_query = text("""
        SELECT COUNT(*) as count
        FROM production_lines
        WHERE next_maintenance_date <= CURRENT_DATE + INTERVAL '7 days'
    """)
    maintenance_result = await db.execute(maintenance_query)
    maintenance_due = maintenance_result.scalar()

    # Lines currently in use (have a current work order)
    in_use_query = text("""
        SELECT COUNT(*) as count
        FROM production_lines
        WHERE current_work_order_id IS NOT NULL
    """)
    in_use_result = await db.execute(in_use_query)
    lines_in_use = in_use_result.scalar()

    # Utilization rate
    utilization_rate = 0
    if total_lines > 0:
        utilization_rate = round((lines_in_use / total_lines) * 100, 2)

    # Lines by status
    status_query = text("""
        SELECT status, COUNT(*) as count
        FROM production_lines
        GROUP BY status
    """)
    status_result = await db.execute(status_query)
    lines_by_status = {row[0]: row[1] for row in status_result.all()}

    # Total capacity per hour across all operational lines
    capacity_query = text("""
        SELECT COALESCE(SUM(capacity_per_hour), 0) as total_capacity
        FROM production_lines
        WHERE status = 'operational'
    """)
    capacity_result = await db.execute(capacity_query)
    total_capacity = capacity_result.scalar()

    return {
        "total_lines": total_lines,
        "operational_lines": operational_lines,
        "maintenance_due": maintenance_due,
        "lines_in_use": lines_in_use,
        "utilization_rate": utilization_rate,
        "lines_by_status": lines_by_status,
        "total_capacity_per_hour": total_capacity
    }


@router.get("/{line_id}")
async def get_production_line(line_id: str, db: AsyncSession = Depends(get_db)):
    """Get production line details by ID."""
    query = text("""
        SELECT pl.*, wo.work_order_number, p.product_name
        FROM production_lines pl
        LEFT JOIN work_orders wo ON pl.current_work_order_id = wo.id
        LEFT JOIN products p ON wo.product_id = p.id
        WHERE pl.id = :line_id
    """)
    result = await db.execute(query, {"line_id": line_id})
    production_line = result.mappings().first()

    if not production_line:
        raise HTTPException(status_code=404, detail="Production line not found")

    return {"production_line": dict(production_line)}


@router.post("")
async def create_production_line(line_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new production line."""
    line_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO production_lines (
            id, line_code, line_name, status, capacity_per_hour,
            current_work_order_id, last_maintenance_date,
            next_maintenance_date, notes
        ) VALUES (
            :id, :line_code, :line_name, :status, :capacity_per_hour,
            :current_work_order_id, :last_maintenance_date,
            :next_maintenance_date, :notes
        )
        RETURNING *
    """)

    params = {
        "id": line_id,
        "line_code": line_data.get("line_code"),
        "line_name": line_data.get("line_name"),
        "status": line_data.get("status", "operational"),
        "capacity_per_hour": line_data.get("capacity_per_hour", 0),
        "current_work_order_id": line_data.get("current_work_order_id"),
        "last_maintenance_date": line_data.get("last_maintenance_date"),
        "next_maintenance_date": line_data.get("next_maintenance_date"),
        "notes": line_data.get("notes", "")
    }

    result = await db.execute(query, params)
    await db.commit()
    production_line = result.mappings().first()

    return {"production_line": dict(production_line), "message": "Production line created successfully"}


@router.put("/{line_id}")
async def update_production_line(line_id: str, line_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing production line."""
    update_fields = []
    params = {"line_id": line_id}

    for key, value in line_data.items():
        if key != "id" and key != "created_at":
            update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE production_lines
        SET {', '.join(update_fields)}
        WHERE id = :line_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    production_line = result.mappings().first()

    if not production_line:
        raise HTTPException(status_code=404, detail="Production line not found")

    return {"production_line": dict(production_line), "message": "Production line updated successfully"}


@router.delete("/{line_id}")
async def delete_production_line(line_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a production line."""
    query = text("DELETE FROM production_lines WHERE id = :line_id RETURNING id")
    result = await db.execute(query, {"line_id": line_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Production line not found")

    return {"message": "Production line deleted successfully", "id": str(deleted["id"])}
