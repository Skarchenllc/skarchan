from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("")
async def list_inventory(
    location: Optional[str] = None,
    low_stock: Optional[bool] = None,
    product_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all inventory items with optional filters."""
    query = """
        SELECT i.*, p.product_name, p.product_code, p.reorder_point
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE 1=1
    """
    params = {}

    if location:
        query += " AND i.location = :location"
        params["location"] = location

    if product_id:
        query += " AND i.product_id = :product_id"
        params["product_id"] = product_id

    if low_stock:
        query += " AND i.quantity_available < i.minimum_stock"

    query += " ORDER BY i.created_at DESC"

    result = await db.execute(text(query), params)
    inventory_items = result.mappings().all()

    return {
        "inventory": [dict(row) for row in inventory_items],
        "total": len(inventory_items)
    }


@router.get("/stats/overview")
async def get_inventory_stats(db: AsyncSession = Depends(get_db)):
    """Get inventory statistics overview."""
    # Total inventory items
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM inventory"))
    total_items = total_result.scalar()

    # Low stock items
    low_stock_query = text("""
        SELECT COUNT(*) as count
        FROM inventory
        WHERE quantity_available < minimum_stock
    """)
    low_stock_result = await db.execute(low_stock_query)
    low_stock_items = low_stock_result.scalar()

    # Out of stock items
    out_of_stock_query = text("""
        SELECT COUNT(*) as count
        FROM inventory
        WHERE quantity_available = 0
    """)
    out_of_stock_result = await db.execute(out_of_stock_query)
    out_of_stock_items = out_of_stock_result.scalar()

    # Total inventory value
    value_query = text("""
        SELECT COALESCE(SUM(i.quantity_on_hand * p.standard_cost), 0) as total_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
    """)
    value_result = await db.execute(value_query)
    total_value = float(value_result.scalar() or 0)

    # Inventory by location
    location_query = text("""
        SELECT location, COUNT(*) as count, SUM(quantity_on_hand) as total_quantity
        FROM inventory
        GROUP BY location
    """)
    location_result = await db.execute(location_query)
    inventory_by_location = [
        {"location": row[0], "count": row[1], "total_quantity": row[2]}
        for row in location_result.all()
    ]

    # Inventory turnover (items with recent restocks)
    turnover_query = text("""
        SELECT COUNT(*) as count
        FROM inventory
        WHERE last_restock_date >= CURRENT_DATE - INTERVAL '30 days'
    """)
    turnover_result = await db.execute(turnover_query)
    recent_restocks = turnover_result.scalar()

    return {
        "total_items": total_items,
        "low_stock_items": low_stock_items,
        "out_of_stock_items": out_of_stock_items,
        "total_value": round(total_value, 2),
        "inventory_by_location": inventory_by_location,
        "recent_restocks_30_days": recent_restocks
    }


@router.get("/{inventory_id}")
async def get_inventory(inventory_id: str, db: AsyncSession = Depends(get_db)):
    """Get inventory details by ID."""
    query = text("""
        SELECT i.*, p.product_name, p.product_code
        FROM inventory i
        LEFT JOIN products p ON i.product_id = p.id
        WHERE i.id = :inventory_id
    """)
    result = await db.execute(query, {"inventory_id": inventory_id})
    inventory = result.mappings().first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    return {"inventory": dict(inventory)}


@router.post("")
async def create_inventory(inventory_data: dict, db: AsyncSession = Depends(get_db)):
    """Create or update inventory record."""
    inventory_id = str(uuid.uuid4())

    # Calculate quantity_available
    quantity_on_hand = inventory_data.get("quantity_on_hand", 0)
    quantity_reserved = inventory_data.get("quantity_reserved", 0)
    quantity_available = quantity_on_hand - quantity_reserved

    query = text("""
        INSERT INTO inventory (
            id, product_id, location, quantity_on_hand, quantity_reserved,
            quantity_available, last_restock_date, last_count_date,
            minimum_stock, maximum_stock
        ) VALUES (
            :id, :product_id, :location, :quantity_on_hand, :quantity_reserved,
            :quantity_available, :last_restock_date, :last_count_date,
            :minimum_stock, :maximum_stock
        )
        RETURNING *
    """)

    params = {
        "id": inventory_id,
        "product_id": inventory_data.get("product_id"),
        "location": inventory_data.get("location"),
        "quantity_on_hand": quantity_on_hand,
        "quantity_reserved": quantity_reserved,
        "quantity_available": quantity_available,
        "last_restock_date": inventory_data.get("last_restock_date"),
        "last_count_date": inventory_data.get("last_count_date"),
        "minimum_stock": inventory_data.get("minimum_stock", 0),
        "maximum_stock": inventory_data.get("maximum_stock", 0)
    }

    result = await db.execute(query, params)
    await db.commit()
    inventory = result.mappings().first()

    return {"inventory": dict(inventory), "message": "Inventory record created successfully"}


@router.put("/{inventory_id}")
async def update_inventory(inventory_id: str, inventory_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing inventory record."""
    update_fields = []
    params = {"inventory_id": inventory_id}

    # Recalculate quantity_available if quantities are being updated
    if "quantity_on_hand" in inventory_data or "quantity_reserved" in inventory_data:
        # Get current values
        current_query = text("SELECT quantity_on_hand, quantity_reserved FROM inventory WHERE id = :inventory_id")
        current_result = await db.execute(current_query, {"inventory_id": inventory_id})
        current = current_result.first()

        if current:
            quantity_on_hand = inventory_data.get("quantity_on_hand", current[0])
            quantity_reserved = inventory_data.get("quantity_reserved", current[1])
            inventory_data["quantity_available"] = quantity_on_hand - quantity_reserved

    for key, value in inventory_data.items():
        if key != "id" and key != "created_at":
            update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE inventory
        SET {', '.join(update_fields)}
        WHERE id = :inventory_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    inventory = result.mappings().first()

    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    return {"inventory": dict(inventory), "message": "Inventory record updated successfully"}
