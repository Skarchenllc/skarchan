#!/usr/bin/env python3
"""
Seed script for Production module tables
Creates 5 sample records for each production entity
"""

import psycopg2
from datetime import datetime, date, timedelta
import uuid
import json

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="business_management",
    user="postgres",
    password="postgres"
)
cur = conn.cursor()

print("🏭 Starting Production module seed...")

# 1. Products (5 records)
print("\n📦 Creating Products...")
products = [
    {
        'id': str(uuid.uuid4()),
        'product_code': 'PRD-001',
        'product_name': 'Industrial Widget A',
        'description': 'High-performance industrial widget for manufacturing',
        'category': 'finished_goods',
        'unit_of_measure': 'piece',
        'standard_cost': 45.50,
        'selling_price': 75.00,
        'reorder_point': 100,
        'lead_time_days': 7,
        'is_active': True,
        'specifications': json.dumps({'weight': '2.5kg', 'dimensions': '10x10x5cm', 'material': 'steel'})
    },
    {
        'id': str(uuid.uuid4()),
        'product_code': 'PRD-002',
        'product_name': 'Precision Gear Assembly',
        'description': 'High-precision gear assembly for mechanical systems',
        'category': 'finished_goods',
        'unit_of_measure': 'piece',
        'standard_cost': 125.00,
        'selling_price': 200.00,
        'reorder_point': 50,
        'lead_time_days': 10,
        'is_active': True,
        'specifications': json.dumps({'weight': '5.0kg', 'teeth': 48, 'material': 'hardened_steel'})
    },
    {
        'id': str(uuid.uuid4()),
        'product_code': 'PRD-003',
        'product_name': 'Electronic Control Unit',
        'description': 'Programmable electronic control unit for automation',
        'category': 'finished_goods',
        'unit_of_measure': 'piece',
        'standard_cost': 85.00,
        'selling_price': 150.00,
        'reorder_point': 75,
        'lead_time_days': 14,
        'is_active': True,
        'specifications': json.dumps({'voltage': '24V DC', 'ports': 8, 'protocol': 'Modbus'})
    },
    {
        'id': str(uuid.uuid4()),
        'product_code': 'PRD-004',
        'product_name': 'Hydraulic Cylinder',
        'description': 'Heavy-duty hydraulic cylinder for industrial machinery',
        'category': 'finished_goods',
        'unit_of_measure': 'piece',
        'standard_cost': 250.00,
        'selling_price': 400.00,
        'reorder_point': 25,
        'lead_time_days': 21,
        'is_active': True,
        'specifications': json.dumps({'bore': '100mm', 'stroke': '500mm', 'pressure': '350bar'})
    },
    {
        'id': str(uuid.uuid4()),
        'product_code': 'PRD-005',
        'product_name': 'Conveyor Belt Module',
        'description': 'Modular conveyor belt section for production lines',
        'category': 'finished_goods',
        'unit_of_measure': 'meter',
        'standard_cost': 35.00,
        'selling_price': 60.00,
        'reorder_point': 200,
        'lead_time_days': 5,
        'is_active': True,
        'specifications': json.dumps({'width': '600mm', 'material': 'PVC', 'load_capacity': '50kg/m'})
    }
]

for product in products:
    cur.execute("""
        INSERT INTO products (
            id, product_code, product_name, description, category, unit_of_measure,
            standard_cost, selling_price, reorder_point, lead_time_days, is_active,
            specifications, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (product_code) DO NOTHING
    """, (
        product['id'], product['product_code'], product['product_name'],
        product['description'], product['category'], product['unit_of_measure'],
        product['standard_cost'], product['selling_price'], product['reorder_point'],
        product['lead_time_days'], product['is_active'], product['specifications'],
        datetime.now(), datetime.now()
    ))
    print(f"  ✓ Created product: {product['product_name']}")

conn.commit()

# Store product IDs for later use
product_ids = [p['id'] for p in products]

# 2. Bill of Materials (5 records)
print("\n📋 Creating Bill of Materials...")
boms = [
    {
        'id': str(uuid.uuid4()),
        'bom_code': 'BOM-001',
        'product_id': product_ids[0],
        'version': 'v1.0',
        'is_active': True,
        'materials': json.dumps([
            {'item': 'Steel Sheet', 'quantity': 2, 'unit': 'kg', 'cost': 15.00},
            {'item': 'Fasteners', 'quantity': 12, 'unit': 'piece', 'cost': 0.50},
            {'item': 'Coating', 'quantity': 0.5, 'unit': 'liter', 'cost': 8.00}
        ]),
        'total_material_cost': 40.00,
        'labor_cost': 3.50,
        'overhead_cost': 2.00,
        'total_cost': 45.50,
        'notes': 'Standard production BOM'
    },
    {
        'id': str(uuid.uuid4()),
        'bom_code': 'BOM-002',
        'product_id': product_ids[1],
        'version': 'v2.1',
        'is_active': True,
        'materials': json.dumps([
            {'item': 'Hardened Steel Bar', 'quantity': 3, 'unit': 'kg', 'cost': 25.00},
            {'item': 'Precision Bearings', 'quantity': 4, 'unit': 'piece', 'cost': 8.00},
            {'item': 'Lubricant', 'quantity': 0.2, 'unit': 'liter', 'cost': 5.00}
        ]),
        'total_material_cost': 105.00,
        'labor_cost': 15.00,
        'overhead_cost': 5.00,
        'total_cost': 125.00,
        'notes': 'Precision machining required'
    },
    {
        'id': str(uuid.uuid4()),
        'bom_code': 'BOM-003',
        'product_id': product_ids[2],
        'version': 'v1.5',
        'is_active': True,
        'materials': json.dumps([
            {'item': 'PCB Board', 'quantity': 1, 'unit': 'piece', 'cost': 35.00},
            {'item': 'Microcontroller', 'quantity': 1, 'unit': 'piece', 'cost': 18.00},
            {'item': 'Electronic Components', 'quantity': 1, 'unit': 'set', 'cost': 22.00}
        ]),
        'total_material_cost': 75.00,
        'labor_cost': 8.00,
        'overhead_cost': 2.00,
        'total_cost': 85.00,
        'notes': 'Assembly and programming required'
    },
    {
        'id': str(uuid.uuid4()),
        'bom_code': 'BOM-004',
        'product_id': product_ids[3],
        'version': 'v1.0',
        'is_active': True,
        'materials': json.dumps([
            {'item': 'Cylinder Tube', 'quantity': 1, 'unit': 'piece', 'cost': 120.00},
            {'item': 'Piston Rod', 'quantity': 1, 'unit': 'piece', 'cost': 60.00},
            {'item': 'Seals and Gaskets', 'quantity': 1, 'unit': 'set', 'cost': 35.00}
        ]),
        'total_material_cost': 215.00,
        'labor_cost': 25.00,
        'overhead_cost': 10.00,
        'total_cost': 250.00,
        'notes': 'Heavy machinery assembly'
    },
    {
        'id': str(uuid.uuid4()),
        'bom_code': 'BOM-005',
        'product_id': product_ids[4],
        'version': 'v1.2',
        'is_active': True,
        'materials': json.dumps([
            {'item': 'PVC Belt Material', 'quantity': 1.1, 'unit': 'meter', 'cost': 25.00},
            {'item': 'Mounting Brackets', 'quantity': 2, 'unit': 'piece', 'cost': 3.00},
            {'item': 'Roller Assembly', 'quantity': 2, 'unit': 'piece', 'cost': 2.00}
        ]),
        'total_material_cost': 31.00,
        'labor_cost': 3.00,
        'overhead_cost': 1.00,
        'total_cost': 35.00,
        'notes': 'Modular assembly'
    }
]

for bom in boms:
    cur.execute("""
        INSERT INTO bill_of_materials (
            id, bom_code, product_id, version, is_active, materials,
            total_material_cost, labor_cost, overhead_cost, total_cost,
            notes, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (bom_code) DO NOTHING
    """, (
        bom['id'], bom['bom_code'], bom['product_id'], bom['version'],
        bom['is_active'], bom['materials'], bom['total_material_cost'],
        bom['labor_cost'], bom['overhead_cost'], bom['total_cost'],
        bom['notes'], datetime.now(), datetime.now()
    ))
    print(f"  ✓ Created BOM: {bom['bom_code']}")

conn.commit()

# Store BOM IDs for later use
bom_ids = [b['id'] for b in boms]

# 3. Production Lines (5 records)
print("\n🏭 Creating Production Lines...")
production_lines = [
    {
        'id': str(uuid.uuid4()),
        'line_code': 'LINE-A1',
        'line_name': 'Assembly Line A',
        'status': 'operational',
        'capacity_per_hour': 50,
        'last_maintenance_date': date.today() - timedelta(days=15),
        'next_maintenance_date': date.today() + timedelta(days=75),
        'notes': 'Main assembly line for widgets'
    },
    {
        'id': str(uuid.uuid4()),
        'line_code': 'LINE-B1',
        'line_name': 'Precision Machining Line',
        'status': 'operational',
        'capacity_per_hour': 20,
        'last_maintenance_date': date.today() - timedelta(days=7),
        'next_maintenance_date': date.today() + timedelta(days=83),
        'notes': 'CNC machining for precision parts'
    },
    {
        'id': str(uuid.uuid4()),
        'line_code': 'LINE-C1',
        'line_name': 'Electronics Assembly',
        'status': 'idle',
        'capacity_per_hour': 30,
        'last_maintenance_date': date.today() - timedelta(days=30),
        'next_maintenance_date': date.today() + timedelta(days=60),
        'notes': 'PCB assembly and testing'
    },
    {
        'id': str(uuid.uuid4()),
        'line_code': 'LINE-D1',
        'line_name': 'Heavy Equipment Line',
        'status': 'maintenance',
        'capacity_per_hour': 10,
        'last_maintenance_date': date.today() - timedelta(days=1),
        'next_maintenance_date': date.today() + timedelta(days=89),
        'notes': 'Currently under scheduled maintenance'
    },
    {
        'id': str(uuid.uuid4()),
        'line_code': 'LINE-E1',
        'line_name': 'Conveyor Fabrication',
        'status': 'operational',
        'capacity_per_hour': 40,
        'last_maintenance_date': date.today() - timedelta(days=20),
        'next_maintenance_date': date.today() + timedelta(days=70),
        'notes': 'Belt cutting and assembly'
    }
]

for line in production_lines:
    cur.execute("""
        INSERT INTO production_lines (
            id, line_code, line_name, status, capacity_per_hour,
            last_maintenance_date, next_maintenance_date, notes,
            created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (line_code) DO NOTHING
    """, (
        line['id'], line['line_code'], line['line_name'], line['status'],
        line['capacity_per_hour'], line['last_maintenance_date'],
        line['next_maintenance_date'], line['notes'],
        datetime.now(), datetime.now()
    ))
    print(f"  ✓ Created production line: {line['line_name']}")

conn.commit()

# 4. Work Orders (5 records)
print("\n📝 Creating Work Orders...")
work_orders = [
    {
        'id': str(uuid.uuid4()),
        'work_order_number': 'WO-2024-001',
        'product_id': product_ids[0],
        'bom_id': bom_ids[0],
        'quantity_planned': 500,
        'quantity_produced': 500,
        'quantity_rejected': 8,
        'status': 'completed',
        'priority': 'medium',
        'scheduled_start_date': date.today() - timedelta(days=14),
        'scheduled_end_date': date.today() - timedelta(days=7),
        'actual_start_date': datetime.now() - timedelta(days=14),
        'actual_end_date': datetime.now() - timedelta(days=7),
        'production_line': 'LINE-A1',
        'assigned_to': 'Production Team A',
        'notes': 'Completed on schedule',
        'created_by': 'admin'
    },
    {
        'id': str(uuid.uuid4()),
        'work_order_number': 'WO-2024-002',
        'product_id': product_ids[1],
        'bom_id': bom_ids[1],
        'quantity_planned': 200,
        'quantity_produced': 150,
        'quantity_rejected': 3,
        'status': 'in_progress',
        'priority': 'high',
        'scheduled_start_date': date.today() - timedelta(days=5),
        'scheduled_end_date': date.today() + timedelta(days=10),
        'actual_start_date': datetime.now() - timedelta(days=5),
        'production_line': 'LINE-B1',
        'assigned_to': 'Machining Team',
        'notes': 'Currently in progress, 75% complete',
        'created_by': 'admin'
    },
    {
        'id': str(uuid.uuid4()),
        'work_order_number': 'WO-2024-003',
        'product_id': product_ids[2],
        'bom_id': bom_ids[2],
        'quantity_planned': 300,
        'quantity_produced': 0,
        'quantity_rejected': 0,
        'status': 'pending',
        'priority': 'medium',
        'scheduled_start_date': date.today() + timedelta(days=3),
        'scheduled_end_date': date.today() + timedelta(days=17),
        'production_line': 'LINE-C1',
        'assigned_to': 'Electronics Team',
        'notes': 'Waiting for component delivery',
        'created_by': 'admin'
    },
    {
        'id': str(uuid.uuid4()),
        'work_order_number': 'WO-2024-004',
        'product_id': product_ids[3],
        'bom_id': bom_ids[3],
        'quantity_planned': 100,
        'quantity_produced': 0,
        'quantity_rejected': 0,
        'status': 'pending',
        'priority': 'urgent',
        'scheduled_start_date': date.today() + timedelta(days=1),
        'scheduled_end_date': date.today() + timedelta(days=15),
        'production_line': 'LINE-D1',
        'assigned_to': 'Heavy Equipment Team',
        'notes': 'Rush order - expedite production',
        'created_by': 'admin'
    },
    {
        'id': str(uuid.uuid4()),
        'work_order_number': 'WO-2024-005',
        'product_id': product_ids[4],
        'bom_id': bom_ids[4],
        'quantity_planned': 1000,
        'quantity_produced': 1000,
        'quantity_rejected': 15,
        'status': 'completed',
        'priority': 'low',
        'scheduled_start_date': date.today() - timedelta(days=21),
        'scheduled_end_date': date.today() - timedelta(days=14),
        'actual_start_date': datetime.now() - timedelta(days=21),
        'actual_end_date': datetime.now() - timedelta(days=14),
        'production_line': 'LINE-E1',
        'assigned_to': 'Fabrication Team',
        'notes': 'Large batch completed successfully',
        'created_by': 'admin'
    }
]

for wo in work_orders:
    cur.execute("""
        INSERT INTO work_orders (
            id, work_order_number, product_id, bom_id, quantity_planned,
            quantity_produced, quantity_rejected, status, priority,
            scheduled_start_date, scheduled_end_date, actual_start_date,
            actual_end_date, production_line, assigned_to, notes, created_by,
            created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (work_order_number) DO NOTHING
    """, (
        wo['id'], wo['work_order_number'], wo['product_id'], wo['bom_id'],
        wo['quantity_planned'], wo['quantity_produced'], wo['quantity_rejected'],
        wo['status'], wo['priority'], wo['scheduled_start_date'],
        wo['scheduled_end_date'], wo.get('actual_start_date'),
        wo.get('actual_end_date'), wo['production_line'], wo['assigned_to'],
        wo['notes'], wo['created_by'], datetime.now(), datetime.now()
    ))
    print(f"  ✓ Created work order: {wo['work_order_number']}")

conn.commit()

# 5. Inventory (5 records - one for each product at different locations)
print("\n📦 Creating Inventory Records...")
inventory_records = [
    {
        'id': str(uuid.uuid4()),
        'product_id': product_ids[0],
        'location': 'Warehouse A - Main',
        'quantity_on_hand': 850,
        'quantity_reserved': 200,
        'quantity_available': 650,
        'last_restock_date': datetime.now() - timedelta(days=5),
        'last_count_date': datetime.now() - timedelta(days=2),
        'minimum_stock': 100,
        'maximum_stock': 1000
    },
    {
        'id': str(uuid.uuid4()),
        'product_id': product_ids[1],
        'location': 'Warehouse B - Precision',
        'quantity_on_hand': 320,
        'quantity_reserved': 150,
        'quantity_available': 170,
        'last_restock_date': datetime.now() - timedelta(days=10),
        'last_count_date': datetime.now() - timedelta(days=1),
        'minimum_stock': 50,
        'maximum_stock': 500
    },
    {
        'id': str(uuid.uuid4()),
        'product_id': product_ids[2],
        'location': 'Warehouse C - Electronics',
        'quantity_on_hand': 425,
        'quantity_reserved': 300,
        'quantity_available': 125,
        'last_restock_date': datetime.now() - timedelta(days=15),
        'last_count_date': datetime.now() - timedelta(days=3),
        'minimum_stock': 75,
        'maximum_stock': 600
    },
    {
        'id': str(uuid.uuid4()),
        'product_id': product_ids[3],
        'location': 'Warehouse D - Heavy Equipment',
        'quantity_on_hand': 85,
        'quantity_reserved': 35,
        'quantity_available': 50,
        'last_restock_date': datetime.now() - timedelta(days=30),
        'last_count_date': datetime.now() - timedelta(days=7),
        'minimum_stock': 25,
        'maximum_stock': 150
    },
    {
        'id': str(uuid.uuid4()),
        'product_id': product_ids[4],
        'location': 'Warehouse E - Materials',
        'quantity_on_hand': 2500,
        'quantity_reserved': 1000,
        'quantity_available': 1500,
        'last_restock_date': datetime.now() - timedelta(days=3),
        'last_count_date': datetime.now() - timedelta(days=1),
        'minimum_stock': 200,
        'maximum_stock': 3000
    }
]

for inv in inventory_records:
    cur.execute("""
        INSERT INTO inventory (
            id, product_id, location, quantity_on_hand, quantity_reserved,
            quantity_available, last_restock_date, last_count_date,
            minimum_stock, maximum_stock, created_at, updated_at
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        inv['id'], inv['product_id'], inv['location'], inv['quantity_on_hand'],
        inv['quantity_reserved'], inv['quantity_available'], inv['last_restock_date'],
        inv['last_count_date'], inv['minimum_stock'], inv['maximum_stock'],
        datetime.now(), datetime.now()
    ))
    print(f"  ✓ Created inventory record at: {inv['location']}")

conn.commit()

# Summary
print("\n" + "="*60)
print("✅ Production Module Seed Completed Successfully!")
print("="*60)
print(f"📦 Products: 5 created")
print(f"📋 Bill of Materials: 5 created")
print(f"🏭 Production Lines: 5 created")
print(f"📝 Work Orders: 5 created")
print(f"📦 Inventory Records: 5 created")
print("="*60)

cur.close()
conn.close()

print("\n🎉 All production data has been seeded successfully!")
