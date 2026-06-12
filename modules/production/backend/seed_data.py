"""
Seed data script for Production Operations module.
Run this script to populate the database with sample data.
"""

import asyncio
import sys
import json
from datetime import datetime, date, timedelta
from sqlalchemy import text
from app.core.database import AsyncSessionLocal


async def seed_products():
    """Seed sample products."""
    async with AsyncSessionLocal() as session:
        products = [
            {
                "product_code": "RM-001",
                "product_name": "Steel Sheet Metal",
                "description": "High-grade steel sheet metal, 2mm thickness",
                "category": "raw_material",
                "unit_of_measure": "kg",
                "standard_cost": 15.50,
                "selling_price": 0.00,
                "reorder_point": 500,
                "lead_time_days": 7,
                "specifications": {"thickness": "2mm", "grade": "304"}
            },
            {
                "product_code": "RM-002",
                "product_name": "Aluminum Rods",
                "description": "Aluminum rods for component manufacturing",
                "category": "raw_material",
                "unit_of_measure": "kg",
                "standard_cost": 12.00,
                "selling_price": 0.00,
                "reorder_point": 300,
                "lead_time_days": 5,
                "specifications": {"diameter": "10mm", "alloy": "6061"}
            },
            {
                "product_code": "COMP-001",
                "product_name": "Motor Assembly",
                "description": "Electric motor assembly for product line",
                "category": "component",
                "unit_of_measure": "pieces",
                "standard_cost": 85.00,
                "selling_price": 0.00,
                "reorder_point": 50,
                "lead_time_days": 14,
                "specifications": {"voltage": "240V", "power": "1.5HP"}
            },
            {
                "product_code": "FG-001",
                "product_name": "Industrial Pump Model A",
                "description": "High-performance industrial water pump",
                "category": "finished_good",
                "unit_of_measure": "pieces",
                "standard_cost": 450.00,
                "selling_price": 750.00,
                "reorder_point": 10,
                "lead_time_days": 21,
                "specifications": {"flow_rate": "500L/min", "pressure": "10bar"}
            },
            {
                "product_code": "FG-002",
                "product_name": "Industrial Pump Model B",
                "description": "Heavy-duty industrial pump for large operations",
                "category": "finished_good",
                "unit_of_measure": "pieces",
                "standard_cost": 650.00,
                "selling_price": 1100.00,
                "reorder_point": 5,
                "lead_time_days": 28,
                "specifications": {"flow_rate": "1000L/min", "pressure": "15bar"}
            }
        ]

        for product in products:
            # Convert specifications dict to JSON string
            product_data = {**product, 'specifications': json.dumps(product['specifications'])}
            query = text("""
                INSERT INTO products (
                    id, product_code, product_name, description, category,
                    unit_of_measure, standard_cost, selling_price, reorder_point,
                    lead_time_days, is_active, specifications
                ) VALUES (
                    gen_random_uuid(), :product_code, :product_name, :description, :category,
                    :unit_of_measure, :standard_cost, :selling_price, :reorder_point,
                    :lead_time_days, true, CAST(:specifications AS jsonb)
                )
                ON CONFLICT (product_code) DO NOTHING
            """)
            await session.execute(query, product_data)

        await session.commit()
        print("Products seeded successfully!")


async def seed_boms():
    """Seed sample Bill of Materials."""
    async with AsyncSessionLocal() as session:
        # Get product IDs
        products_query = text("SELECT id, product_code FROM products")
        result = await session.execute(products_query)
        products = {row[1]: str(row[0]) for row in result.all()}

        boms = [
            {
                "bom_code": "BOM-FG001",
                "product_id": products.get("FG-001"),
                "version": "1.0",
                "materials": [
                    {
                        "product_id": products.get("RM-001"),
                        "product_code": "RM-001",
                        "product_name": "Steel Sheet Metal",
                        "quantity": 10,
                        "unit": "kg",
                        "cost": 155.00
                    },
                    {
                        "product_id": products.get("RM-002"),
                        "product_code": "RM-002",
                        "product_name": "Aluminum Rods",
                        "quantity": 5,
                        "unit": "kg",
                        "cost": 60.00
                    },
                    {
                        "product_id": products.get("COMP-001"),
                        "product_code": "COMP-001",
                        "product_name": "Motor Assembly",
                        "quantity": 1,
                        "unit": "pieces",
                        "cost": 85.00
                    }
                ],
                "total_material_cost": 300.00,
                "labor_cost": 100.00,
                "overhead_cost": 50.00,
                "total_cost": 450.00,
                "notes": "Standard BOM for Model A pump"
            },
            {
                "bom_code": "BOM-FG002",
                "product_id": products.get("FG-002"),
                "version": "1.0",
                "materials": [
                    {
                        "product_id": products.get("RM-001"),
                        "product_code": "RM-001",
                        "product_name": "Steel Sheet Metal",
                        "quantity": 20,
                        "unit": "kg",
                        "cost": 310.00
                    },
                    {
                        "product_id": products.get("RM-002"),
                        "product_code": "RM-002",
                        "product_name": "Aluminum Rods",
                        "quantity": 8,
                        "unit": "kg",
                        "cost": 96.00
                    },
                    {
                        "product_id": products.get("COMP-001"),
                        "product_code": "COMP-001",
                        "product_name": "Motor Assembly",
                        "quantity": 2,
                        "unit": "pieces",
                        "cost": 170.00
                    }
                ],
                "total_material_cost": 576.00,
                "labor_cost": 150.00,
                "overhead_cost": 74.00,
                "total_cost": 800.00,
                "notes": "Standard BOM for Model B pump"
            },
            {
                "bom_code": "BOM-COMP001",
                "product_id": products.get("COMP-001"),
                "version": "1.0",
                "materials": [
                    {
                        "product_id": products.get("RM-002"),
                        "product_code": "RM-002",
                        "product_name": "Aluminum Rods",
                        "quantity": 2,
                        "unit": "kg",
                        "cost": 24.00
                    }
                ],
                "total_material_cost": 24.00,
                "labor_cost": 45.00,
                "overhead_cost": 16.00,
                "total_cost": 85.00,
                "notes": "Motor assembly components"
            }
        ]

        for bom in boms:
            if bom["product_id"]:  # Only insert if product exists
                # Convert materials list to JSON string
                bom_data = {**bom, 'materials': json.dumps(bom['materials'])}
                query = text("""
                    INSERT INTO bill_of_materials (
                        id, bom_code, product_id, version, is_active, materials,
                        total_material_cost, labor_cost, overhead_cost, total_cost, notes
                    ) VALUES (
                        gen_random_uuid(), :bom_code, CAST(:product_id AS uuid), :version, true, CAST(:materials AS jsonb),
                        :total_material_cost, :labor_cost, :overhead_cost, :total_cost, :notes
                    )
                    ON CONFLICT (bom_code) DO NOTHING
                """)
                await session.execute(query, bom_data)

        await session.commit()
        print("Bill of Materials seeded successfully!")


async def seed_work_orders():
    """Seed sample work orders."""
    async with AsyncSessionLocal() as session:
        # Get product and BOM IDs
        products_query = text("SELECT id, product_code FROM products WHERE category = 'finished_good'")
        result = await session.execute(products_query)
        products = {row[1]: str(row[0]) for row in result.all()}

        boms_query = text("SELECT id, bom_code FROM bill_of_materials")
        result = await session.execute(boms_query)
        boms = {row[1]: str(row[0]) for row in result.all()}

        today = date.today()
        work_orders = [
            {
                "work_order_number": "WO-2024-001",
                "product_id": products.get("FG-001"),
                "bom_id": boms.get("BOM-FG001"),
                "quantity_planned": 50,
                "quantity_produced": 50,
                "quantity_rejected": 2,
                "status": "completed",
                "priority": "medium",
                "scheduled_start_date": today - timedelta(days=10),
                "scheduled_end_date": today - timedelta(days=3),
                "actual_start_date": datetime.now() - timedelta(days=10),
                "actual_end_date": datetime.now() - timedelta(days=3),
                "production_line": "LINE-01",
                "assigned_to": "John Smith",
                "notes": "Completed successfully",
                "created_by": "Production Manager"
            },
            {
                "work_order_number": "WO-2024-002",
                "product_id": products.get("FG-002"),
                "bom_id": boms.get("BOM-FG002"),
                "quantity_planned": 30,
                "quantity_produced": 15,
                "quantity_rejected": 1,
                "status": "in_progress",
                "priority": "high",
                "scheduled_start_date": today - timedelta(days=5),
                "scheduled_end_date": today + timedelta(days=5),
                "actual_start_date": datetime.now() - timedelta(days=5),
                "actual_end_date": None,
                "production_line": "LINE-02",
                "assigned_to": "Jane Doe",
                "notes": "On schedule",
                "created_by": "Production Manager"
            },
            {
                "work_order_number": "WO-2024-003",
                "product_id": products.get("FG-001"),
                "bom_id": boms.get("BOM-FG001"),
                "quantity_planned": 100,
                "quantity_produced": 0,
                "quantity_rejected": 0,
                "status": "scheduled",
                "priority": "medium",
                "scheduled_start_date": today + timedelta(days=3),
                "scheduled_end_date": today + timedelta(days=15),
                "actual_start_date": None,
                "actual_end_date": None,
                "production_line": "LINE-01",
                "assigned_to": "John Smith",
                "notes": "Waiting for materials",
                "created_by": "Production Manager"
            },
            {
                "work_order_number": "WO-2024-004",
                "product_id": products.get("FG-002"),
                "bom_id": boms.get("BOM-FG002"),
                "quantity_planned": 25,
                "quantity_produced": 0,
                "quantity_rejected": 0,
                "status": "draft",
                "priority": "low",
                "scheduled_start_date": today + timedelta(days=10),
                "scheduled_end_date": today + timedelta(days=20),
                "actual_start_date": None,
                "actual_end_date": None,
                "production_line": None,
                "assigned_to": None,
                "notes": "Planning phase",
                "created_by": "Production Manager"
            },
            {
                "work_order_number": "WO-2024-005",
                "product_id": products.get("FG-001"),
                "bom_id": boms.get("BOM-FG001"),
                "quantity_planned": 75,
                "quantity_produced": 0,
                "quantity_rejected": 0,
                "status": "scheduled",
                "priority": "urgent",
                "scheduled_start_date": today + timedelta(days=1),
                "scheduled_end_date": today + timedelta(days=7),
                "actual_start_date": None,
                "actual_end_date": None,
                "production_line": "LINE-03",
                "assigned_to": "Mike Johnson",
                "notes": "Rush order",
                "created_by": "Production Manager"
            }
        ]

        for wo in work_orders:
            if wo["product_id"]:  # Only insert if product exists
                query = text("""
                    INSERT INTO work_orders (
                        id, work_order_number, product_id, bom_id, quantity_planned,
                        quantity_produced, quantity_rejected, status, priority,
                        scheduled_start_date, scheduled_end_date, actual_start_date,
                        actual_end_date, production_line, assigned_to, notes, created_by
                    ) VALUES (
                        gen_random_uuid(), :work_order_number, CAST(:product_id AS uuid), CAST(:bom_id AS uuid), :quantity_planned,
                        :quantity_produced, :quantity_rejected, :status, :priority,
                        :scheduled_start_date, :scheduled_end_date, :actual_start_date,
                        :actual_end_date, :production_line, :assigned_to, :notes, :created_by
                    )
                    ON CONFLICT (work_order_number) DO NOTHING
                """)
                await session.execute(query, wo)

        await session.commit()
        print("Work orders seeded successfully!")


async def seed_inventory():
    """Seed sample inventory records."""
    async with AsyncSessionLocal() as session:
        # Get all product IDs
        products_query = text("SELECT id, product_code FROM products")
        result = await session.execute(products_query)
        products = {row[1]: str(row[0]) for row in result.all()}

        inventory = [
            {
                "product_id": products.get("RM-001"),
                "location": "warehouse",
                "quantity_on_hand": 1000,
                "quantity_reserved": 200,
                "quantity_available": 800,
                "last_restock_date": datetime.now() - timedelta(days=5),
                "last_count_date": datetime.now() - timedelta(days=1),
                "minimum_stock": 500,
                "maximum_stock": 2000
            },
            {
                "product_id": products.get("RM-002"),
                "location": "warehouse",
                "quantity_on_hand": 600,
                "quantity_reserved": 100,
                "quantity_available": 500,
                "last_restock_date": datetime.now() - timedelta(days=3),
                "last_count_date": datetime.now() - timedelta(days=1),
                "minimum_stock": 300,
                "maximum_stock": 1000
            },
            {
                "product_id": products.get("COMP-001"),
                "location": "production_floor",
                "quantity_on_hand": 120,
                "quantity_reserved": 30,
                "quantity_available": 90,
                "last_restock_date": datetime.now() - timedelta(days=7),
                "last_count_date": datetime.now() - timedelta(days=2),
                "minimum_stock": 50,
                "maximum_stock": 200
            },
            {
                "product_id": products.get("FG-001"),
                "location": "warehouse",
                "quantity_on_hand": 35,
                "quantity_reserved": 10,
                "quantity_available": 25,
                "last_restock_date": datetime.now() - timedelta(days=3),
                "last_count_date": datetime.now(),
                "minimum_stock": 10,
                "maximum_stock": 100
            },
            {
                "product_id": products.get("FG-002"),
                "location": "warehouse",
                "quantity_on_hand": 8,
                "quantity_reserved": 5,
                "quantity_available": 3,
                "last_restock_date": datetime.now() - timedelta(days=10),
                "last_count_date": datetime.now(),
                "minimum_stock": 5,
                "maximum_stock": 50
            },
            {
                "product_id": products.get("FG-001"),
                "location": "shipping",
                "quantity_on_hand": 15,
                "quantity_reserved": 15,
                "quantity_available": 0,
                "last_restock_date": datetime.now() - timedelta(days=1),
                "last_count_date": datetime.now(),
                "minimum_stock": 0,
                "maximum_stock": 30
            }
        ]

        for inv in inventory:
            if inv["product_id"]:  # Only insert if product exists
                query = text("""
                    INSERT INTO inventory (
                        id, product_id, location, quantity_on_hand, quantity_reserved,
                        quantity_available, last_restock_date, last_count_date,
                        minimum_stock, maximum_stock
                    ) VALUES (
                        gen_random_uuid(), CAST(:product_id AS uuid), :location, :quantity_on_hand, :quantity_reserved,
                        :quantity_available, :last_restock_date, :last_count_date,
                        :minimum_stock, :maximum_stock
                    )
                """)
                await session.execute(query, inv)

        await session.commit()
        print("Inventory seeded successfully!")


async def seed_production_lines():
    """Seed sample production lines."""
    async with AsyncSessionLocal() as session:
        # Get a work order ID for assignment
        wo_query = text("SELECT id FROM work_orders WHERE status = 'in_progress' LIMIT 1")
        result = await session.execute(wo_query)
        wo_row = result.first()
        current_wo_id = str(wo_row[0]) if wo_row else None

        today = date.today()
        production_lines = [
            {
                "line_code": "LINE-01",
                "line_name": "Assembly Line 1",
                "status": "operational",
                "capacity_per_hour": 10,
                "current_work_order_id": None,
                "last_maintenance_date": today - timedelta(days=30),
                "next_maintenance_date": today + timedelta(days=60),
                "notes": "Primary assembly line for Model A pumps"
            },
            {
                "line_code": "LINE-02",
                "line_name": "Assembly Line 2",
                "status": "operational",
                "capacity_per_hour": 8,
                "current_work_order_id": current_wo_id,
                "last_maintenance_date": today - timedelta(days=45),
                "next_maintenance_date": today + timedelta(days=45),
                "notes": "Heavy-duty line for Model B pumps"
            },
            {
                "line_code": "LINE-03",
                "line_name": "Assembly Line 3",
                "status": "maintenance",
                "capacity_per_hour": 12,
                "current_work_order_id": None,
                "last_maintenance_date": today - timedelta(days=1),
                "next_maintenance_date": today + timedelta(days=89),
                "notes": "Under scheduled maintenance"
            }
        ]

        for line in production_lines:
            query = text("""
                INSERT INTO production_lines (
                    id, line_code, line_name, status, capacity_per_hour,
                    current_work_order_id, last_maintenance_date,
                    next_maintenance_date, notes
                ) VALUES (
                    gen_random_uuid(), :line_code, :line_name, :status, :capacity_per_hour,
                    CAST(:current_work_order_id AS uuid), :last_maintenance_date,
                    :next_maintenance_date, :notes
                )
                ON CONFLICT (line_code) DO NOTHING
            """)
            await session.execute(query, line)

        await session.commit()
        print("Production lines seeded successfully!")


async def main():
    """Main function to run all seed operations."""
    print("Starting database seeding...")
    print("-" * 50)

    try:
        await seed_products()
        await seed_boms()
        await seed_work_orders()
        await seed_inventory()
        await seed_production_lines()

        print("-" * 50)
        print("Database seeding completed successfully!")
        print("\nSummary:")
        print("- 5 Products (2 raw materials, 1 component, 2 finished goods)")
        print("- 3 Bill of Materials")
        print("- 5 Work Orders (various statuses)")
        print("- 6 Inventory Records (across different locations)")
        print("- 3 Production Lines")

    except Exception as e:
        print(f"\nError during seeding: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
