from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from typing import Optional
from app.core.database import get_db
import uuid

router = APIRouter(prefix="/products", tags=["products"])


@router.get("")
async def list_products(
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all products with optional filters."""
    query = "SELECT * FROM products WHERE 1=1"
    params = {}

    if category:
        query += " AND category = :category"
        params["category"] = category

    if is_active is not None:
        query += " AND is_active = :is_active"
        params["is_active"] = is_active

    if search:
        query += " AND (product_code ILIKE :search OR product_name ILIKE :search)"
        params["search"] = f"%{search}%"

    query += " ORDER BY created_at DESC"

    result = await db.execute(text(query), params)
    products = result.mappings().all()

    return {
        "products": [dict(row) for row in products],
        "total": len(products)
    }


@router.get("/stats/overview")
async def get_products_stats(db: AsyncSession = Depends(get_db)):
    """Get product statistics overview."""
    # Total products
    total_result = await db.execute(text("SELECT COUNT(*) as count FROM products"))
    total_products = total_result.scalar()

    # Active products
    active_result = await db.execute(text("SELECT COUNT(*) as count FROM products WHERE is_active = true"))
    active_products = active_result.scalar()

    # Low stock items (products where inventory quantity_available < reorder_point)
    low_stock_query = text("""
        SELECT COUNT(DISTINCT p.id) as count
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE i.quantity_available < p.reorder_point
    """)
    low_stock_result = await db.execute(low_stock_query)
    low_stock_items = low_stock_result.scalar() or 0

    # Total inventory value (sum of quantity_on_hand * standard_cost)
    value_query = text("""
        SELECT COALESCE(SUM(i.quantity_on_hand * p.standard_cost), 0) as total_value
        FROM inventory i
        JOIN products p ON i.product_id = p.id
    """)
    value_result = await db.execute(value_query)
    total_inventory_value = float(value_result.scalar() or 0)

    return {
        "total_products": total_products,
        "active_products": active_products,
        "low_stock_items": low_stock_items,
        "total_inventory_value": round(total_inventory_value, 2)
    }


@router.get("/{product_id}")
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Get product details by ID."""
    query = text("SELECT * FROM products WHERE id = :product_id")
    result = await db.execute(query, {"product_id": product_id})
    product = result.mappings().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"product": dict(product)}


@router.post("")
async def create_product(product_data: dict, db: AsyncSession = Depends(get_db)):
    """Create a new product."""
    product_id = str(uuid.uuid4())

    query = text("""
        INSERT INTO products (
            id, product_code, product_name, description, category,
            unit_of_measure, standard_cost, selling_price, reorder_point,
            lead_time_days, is_active, specifications
        ) VALUES (
            :id, :product_code, :product_name, :description, :category,
            :unit_of_measure, :standard_cost, :selling_price, :reorder_point,
            :lead_time_days, :is_active, :specifications
        )
        RETURNING *
    """)

    params = {
        "id": product_id,
        "product_code": product_data.get("product_code"),
        "product_name": product_data.get("product_name"),
        "description": product_data.get("description", ""),
        "category": product_data.get("category"),
        "unit_of_measure": product_data.get("unit_of_measure"),
        "standard_cost": product_data.get("standard_cost", 0.00),
        "selling_price": product_data.get("selling_price", 0.00),
        "reorder_point": product_data.get("reorder_point", 0),
        "lead_time_days": product_data.get("lead_time_days", 0),
        "is_active": product_data.get("is_active", True),
        "specifications": product_data.get("specifications", {})
    }

    result = await db.execute(query, params)
    await db.commit()
    product = result.mappings().first()

    return {"product": dict(product), "message": "Product created successfully"}


@router.put("/{product_id}")
async def update_product(product_id: str, product_data: dict, db: AsyncSession = Depends(get_db)):
    """Update an existing product."""
    # Build dynamic update query
    update_fields = []
    params = {"product_id": product_id}

    for key, value in product_data.items():
        if key != "id" and key != "created_at":
            update_fields.append(f"{key} = :{key}")
            params[key] = value

    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    query = text(f"""
        UPDATE products
        SET {', '.join(update_fields)}
        WHERE id = :product_id
        RETURNING *
    """)

    result = await db.execute(query, params)
    await db.commit()
    product = result.mappings().first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"product": dict(product), "message": "Product updated successfully"}


@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a product."""
    query = text("DELETE FROM products WHERE id = :product_id RETURNING id")
    result = await db.execute(query, {"product_id": product_id})
    await db.commit()
    deleted = result.mappings().first()

    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")

    return {"message": "Product deleted successfully", "id": str(deleted["id"])}
