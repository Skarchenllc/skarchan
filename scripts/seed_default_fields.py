#!/usr/bin/env python3
"""
Seeds default field definitions in `custom_field_definitions` for entities
that have zero fields. Run after registering new entity routers so the
DynamicEntityForm / EntityList have something to render.

Idempotent — uses ON CONFLICT (entity_type, field_name, deleted_flag).
"""
import os
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"

SYSTEM_USER = "00000000-0000-0000-0000-000000000001"

# Default fields per entity. Each row: (name, label, type, required, picklist|None, group|None)
DEFAULTS = {
    "products": [
        ("name",        "Name",        "text",     True,  None, "General"),
        ("sku",         "SKU",         "text",     True,  None, "General"),
        ("description", "Description", "textarea", False, None, "General"),
        ("price",       "Price",       "currency", True,  None, "Pricing"),
        ("stock",       "Stock",       "number",   False, None, "Inventory"),
        ("category",    "Category",    "picklist", False, ["Physical", "Digital", "Service"], "General"),
        ("is_active",   "Active",      "boolean",  False, None, "General"),
    ],
    "orders": [
        ("order_number",  "Order #",      "text",     True,  None, "General"),
        ("customer_name", "Customer",     "text",     True,  None, "General"),
        ("total",         "Total",        "currency", True,  None, "Pricing"),
        ("status",        "Status",       "picklist", True,  ["Pending", "Paid", "Shipped", "Cancelled", "Refunded"], "General"),
        ("order_date",    "Order Date",   "date",     True,  None, "General"),
        ("notes",         "Notes",        "textarea", False, None, "General"),
    ],
    "pos_sessions": [
        ("session_code",    "Session Code",    "text",     True,  None, "General"),
        ("cashier",         "Cashier",         "text",     True,  None, "General"),
        ("opening_balance", "Opening Balance", "currency", True,  None, "Cash"),
        ("closing_balance", "Closing Balance", "currency", False, None, "Cash"),
        ("opened_at",       "Opened At",       "datetime", True,  None, "Timing"),
        ("closed_at",       "Closed At",       "datetime", False, None, "Timing"),
        ("status",          "Status",          "picklist", True,  ["Open", "Closed"], "General"),
    ],
    "storefronts": [
        ("name",        "Name",        "text",     True,  None, "General"),
        ("url",         "URL",         "url",      False, None, "General"),
        ("description", "Description", "textarea", False, None, "General"),
        ("currency",    "Currency",    "text",     False, None, "Settings"),
        ("is_active",   "Active",      "boolean",  True,  None, "General"),
    ],
    "assets": [
        ("asset_tag",     "Asset Tag",     "text",     True,  None, "Identity"),
        ("name",          "Name",          "text",     True,  None, "Identity"),
        ("category",      "Category",      "picklist", True,  ["Equipment", "Vehicle", "IT Hardware", "Furniture", "Other"], "Identity"),
        ("value",         "Value",         "currency", False, None, "Financial"),
        ("purchase_date", "Purchase Date", "date",     False, None, "Financial"),
        ("location",      "Location",      "text",     False, None, "Tracking"),
        ("status",        "Status",        "picklist", True,  ["Active", "In Maintenance", "Retired", "Disposed"], "Tracking"),
        ("notes",         "Notes",         "textarea", False, None, "General"),
    ],
    "contracts": [
        ("contract_number", "Contract #",   "text",     True,  None, "Identity"),
        ("title",           "Title",        "text",     True,  None, "Identity"),
        ("party",           "Counterparty", "text",     True,  None, "Identity"),
        ("value",           "Value",        "currency", False, None, "Financial"),
        ("start_date",      "Start Date",   "date",     True,  None, "Term"),
        ("end_date",        "End Date",     "date",     True,  None, "Term"),
        ("renewal_date",    "Renewal Date", "date",     False, None, "Term"),
        ("status",          "Status",       "picklist", True,  ["Draft", "Active", "Expired", "Terminated", "Renewed"], "Status"),
        ("notes",           "Notes",        "textarea", False, None, "General"),
    ],
    "documents": [
        ("title",         "Title",        "text",     True,  None, "Identity"),
        ("category",      "Category",     "picklist", False, ["Policy", "Contract", "Report", "Manual", "Image", "Other"], "Identity"),
        ("description",   "Description",  "textarea", False, None, "General"),
        ("file_url",      "File URL",     "url",      False, None, "Storage"),
        ("version",       "Version",      "text",     False, None, "Storage"),
        ("uploaded_date", "Uploaded",     "date",     False, None, "Storage"),
        ("tags",          "Tags",         "text",     False, None, "General"),
    ],
    "subscriptions": [
        ("vendor",         "Vendor",         "text",     True,  None, "Identity"),
        ("product_name",   "Product",        "text",     True,  None, "Identity"),
        ("cost",           "Cost",           "currency", True,  None, "Financial"),
        ("billing_cycle",  "Billing Cycle",  "picklist", True,  ["Monthly", "Quarterly", "Annual", "One-time"], "Financial"),
        ("start_date",     "Start Date",     "date",     True,  None, "Term"),
        ("renewal_date",   "Renewal Date",   "date",     False, None, "Term"),
        ("status",         "Status",         "picklist", True,  ["Active", "Cancelled", "Paused", "Trial"], "Status"),
        ("notes",          "Notes",          "textarea", False, None, "General"),
    ],
    "credentials": [
        ("name",       "Name",          "text",     True,  None, "Identity"),
        ("service",    "Service",       "text",     True,  None, "Identity"),
        ("username",   "Username",      "text",     False, None, "Auth"),
        ("category",   "Category",      "picklist", True,  ["API Key", "Service Account", "Database", "SSH Key", "Other"], "Identity"),
        ("expires_at", "Expires",       "date",     False, None, "Lifecycle"),
        ("is_active",  "Active",        "boolean",  True,  None, "Lifecycle"),
        ("notes",      "Notes",         "textarea", False, None, "General"),
    ],
}

import json

def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()
    inserted = 0
    skipped_entities = []

    for entity_type, fields in DEFAULTS.items():
        # Check whether entity already has any fields. Only seed if zero.
        cur.execute(
            "SELECT COUNT(*) FROM custom_field_definitions WHERE entity_type = %s AND deleted_flag = false",
            (entity_type,),
        )
        existing = cur.fetchone()[0]
        if existing > 0:
            skipped_entities.append(f"{entity_type} (already has {existing})")
            continue

        for order, (name, label, ftype, required, picklist, group) in enumerate(fields, start=1):
            cur.execute(
                """
                INSERT INTO custom_field_definitions
                    (field_name, field_label, field_type, entity_type, is_required,
                     picklist_values, display_order, is_visible, field_group,
                     created_by, last_modified_by)
                VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s, true, %s, %s, %s)
                ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING
                """,
                (name, label, ftype, entity_type, required,
                 json.dumps(picklist) if picklist else None,
                 order, group, SYSTEM_USER, SYSTEM_USER),
            )
            inserted += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f"Inserted {inserted} field definitions.")
    if skipped_entities:
        print(f"Skipped (already had fields): {', '.join(skipped_entities)}")

if __name__ == "__main__":
    main()
