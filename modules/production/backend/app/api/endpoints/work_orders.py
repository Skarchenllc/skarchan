from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid

router = APIRouter(prefix="/work-orders", tags=["work-orders"])


@router.get("")
async def list_work_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    product_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all work orders with optional filters."""
    query = """
        SELECT wo.*, p.product_name, p.product_code
        FROM work_orders wo
        LEFT JOIN products p ON wo.product_id = p.id
        WHERE 1=1
    """
    params = {}

    if status:
        query += " AND wo.status = :status"
        params["status"] = status

    if priority:
        query += " AND wo.priority = :priority"
        params["priority"] = priority

    if product_id:
        query += " AND wo.product_id = :product_id"
        params["product_id"] = product_id

    query += " ORDER BY wo.created_at DESC"

    result = await db.execute(text(query), params)
    work_orders = result.mappings().all()

    return {
        "work_orders": [dict(row) for row in work_orders],
        "total": len(work_orders)
    }


@router.get("/stats/overview")
async def get_work_order_stats(db: AsyncSession = Depends(get_db)):
    """Get work order statistics overview."""
    # Total work orders
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM work_orders"))
    total_orders = total_result.scalar()

    # In progress work orders
    in_progress_result = await db.execute(text("SELECT COUNT(*) as count FROM work_orders WHERE status = 'in_progress'"))
    in_progress = in_progress_result.scalar()

    # Completed work orders
    completed_result = await db.execute(text("SELECT COUNT(*) as count FROM work_orders WHERE status = 'completed'"))
    completed = completed_result.scalar()

    # Scheduled work orders
    scheduled_result = await db.execute(text("SELECT COUNT(*) as count FROM work_orders WHERE status = 'scheduled'"))
    scheduled = scheduled_result.scalar()

    # Completion rate
    completion_rate = 0
    if total_orders > 0:
        completion_rate = round((completed / total_orders) * 100, 2)

    # Orders by priority
    priority_query = text("""
        SELECT priority, COUNT(*) as count
        FROM work_orders
        WHERE status NOT IN ('completed', 'cancelled')
        GROUP BY priority
    """)
    priority_result = await db.execute(priority_query)
    orders_by_priority = {row[0]: row[1] for row in priority_result.all()}

    # Average production efficiency (produced vs planned)
    efficiency_query = text("""
        SELECT
            COALESCE(AVG(CASE WHEN quantity_planned > 0 THEN (quantity_produced::float / quantity_planned) * 100 ELSE 0 END), 0) as avg_efficiency
        FROM work_orders
        WHERE status = 'completed' AND quantity_planned > 0
    """)
    efficiency_result = await db.execute(efficiency_query)
    avg_efficiency = float(efficiency_result.scalar() or 0)

    return {
        "total_orders": total_orders,
        "in_progress": in_progress,
        "completed": completed,
        "scheduled": scheduled,
        "completion_rate": completion_rate,
        "orders_by_priority": orders_by_priority,
        "average_efficiency": round(avg_efficiency, 2)
    }


@router.get("/{work_order_id}")
async def get_work_order(work_order_id: str, db: AsyncSession = Depends(get_db)):
    """Get work order details by ID."""
    query = text("""
        SELECT wo.*, p.product_name, p.product_code, b.bom_code
        FROM work_orders wo
        LEFT JOIN products p ON wo.product_id = p.id
        LEFT JOIN bill_of_materials b ON wo.bom_id = b.id
        WHERE wo.id = :work_order_id
    """)
    result = await db.execute(query, {"work_order_id": work_order_id})
    work_order = result.mappings().first()

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return {"work_order": dict(work_order)}


@router.post("")
async def create_work_order(work_order_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new work order."""
    work_order_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO work_orders (
            id, work_order_number, product_id, bom_id, quantity_planned,
            quantity_produced, quantity_rejected, status, priority,
            scheduled_start_date, scheduled_end_date, actual_start_date,
            actual_end_date, production_line, assigned_to, notes, created_by
        ) VALUES (
            :id, :work_order_number, :product_id, :bom_id, :quantity_planned,
            :quantity_produced, :quantity_rejected, :status, :priority,
            :scheduled_start_date, :scheduled_end_date, :actual_start_date,
            :actual_end_date, :production_line, :assigned_to, :notes, :created_by
        )
        RETURNING *
    """)

    params = {
        "id": work_order_id,
        "work_order_number": work_order_data.get("work_order_number"),
        "product_id": work_order_data.get("product_id"),
        "bom_id": work_order_data.get("bom_id"),
        "quantity_planned": work_order_data.get("quantity_planned"),
        "quantity_produced": work_order_data.get("quantity_produced", 0),
        "quantity_rejected": work_order_data.get("quantity_rejected", 0),
        "status": work_order_data.get("status", "draft"),
        "priority": work_order_data.get("priority", "medium"),
        "scheduled_start_date": work_order_data.get("scheduled_start_date"),
        "scheduled_end_date": work_order_data.get("scheduled_end_date"),
        "actual_start_date": work_order_data.get("actual_start_date"),
        "actual_end_date": work_order_data.get("actual_end_date"),
        "production_line": work_order_data.get("production_line"),
        "assigned_to": work_order_data.get("assigned_to"),
        "notes": work_order_data.get("notes", ""),
        "created_by": work_order_data.get("created_by", "")
    }

    result = await db.execute(query, params)
    await db.commit()
    work_order = result.mappings().first()

    return {"work_order": dict(work_order), "message": "Work order created successfully"}


@router.put("/{work_order_id}")
async def update_work_order(work_order_id: str, work_order_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing work order."""
    update_fields = []
    params = {"work_order_id": work_order_id}

    for key, value in work_order_data.items():
        if key != "id" and key != "created_at" and key != "work_order_number":
            update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE work_orders
        SET {', '.join(update_fields)}
        WHERE id = :work_order_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    work_order = result.mappings().first()

    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")

    return {"work_order": dict(work_order), "message": "Work order updated successfully"}


@router.delete("/{work_order_id}")
async def delete_work_order(work_order_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a work order."""
    query = text("DELETE FROM work_orders WHERE id = :work_order_id RETURNING id")
    result = await db.execute(query, {"work_order_id": work_order_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Work order not found")

    return {"message": "Work order deleted successfully", "id": str(deleted["id"])}
