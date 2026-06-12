#!/usr/bin/env python3
"""
Adds the missing field definitions for `projects` and groups all fields
into sensible sections, so the record preview shows more than just the
status / priority pair.

Idempotent — uses ON CONFLICT and only updates rows that lack a group.
"""
import os
import json
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
SYS = "00000000-0000-0000-0000-000000000001"

# (field_name, field_label, field_type, picklist_values, group, order)
FIELDS = [
    # Identity
    ("name",        "Name",        "text",     None, "Identity", 10),
    ("title",       "Title",       "text",     None, "Identity", 11),
    ("description", "Description", "textarea", None, "Identity", 12),
    ("owner",       "Owner",       "text",     None, "Identity", 13),
    ("manager",     "Manager",     "text",     None, "Identity", 14),
    # Status — existing rows get re-grouped, not re-inserted
    ("status",      "Status",      "picklist", None, "Status",   20),
    ("priority",    "Priority",    "picklist", None, "Status",   21),
    ("progress",    "Progress %",  "number",   None, "Status",   22),
    # Timeline
    ("start_date",  "Start Date",  "date",     None, "Timeline", 30),
    ("end_date",    "End Date",    "date",     None, "Timeline", 31),
    ("due_date",    "Due Date",    "date",     None, "Timeline", 32),
    # Financial
    ("budget",      "Budget",      "currency", None, "Financial", 40),
    ("actual_cost", "Actual Cost", "currency", None, "Financial", 41),
    # Notes
    ("notes",       "Notes",       "textarea", None, "Notes",    50),
]


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()
    inserted = 0
    updated = 0

    for name, label, ftype, picklist, group, order in FIELDS:
        # Check if exists
        cur.execute(
            "SELECT id, field_group FROM custom_field_definitions "
            "WHERE entity_type='projects' AND field_name=%s AND deleted_flag=false",
            (name,),
        )
        row = cur.fetchone()
        if row is None:
            cur.execute(
                """
                INSERT INTO custom_field_definitions
                    (field_name, field_label, field_type, entity_type,
                     is_required, picklist_values, display_order, is_visible,
                     field_group, created_by, last_modified_by)
                VALUES (%s, %s, %s, 'projects', false, %s::jsonb, %s, true,
                        %s, %s, %s)
                ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING
                """,
                (name, label, ftype,
                 json.dumps(picklist) if picklist else None,
                 order, group, SYS, SYS),
            )
            inserted += cur.rowcount
        else:
            existing_id, existing_group = row
            # Keep existing picklist values intact; just (re)set group and order.
            cur.execute(
                """
                UPDATE custom_field_definitions
                   SET field_group   = %s,
                       display_order = %s,
                       last_modified_by   = %s,
                       last_modified_date = NOW()
                 WHERE id = %s
                """,
                (group, order, SYS, existing_id),
            )
            updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {inserted} new fields, updated {updated} existing.")


if __name__ == "__main__":
    main()
