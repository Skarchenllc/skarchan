#!/usr/bin/env python3
"""
Registers the lean QMS (Quality Management) module end-to-end:

  • custom_modules        — one row for the 'qms' module
  • custom_components     — three entity types (inspections, NCRs, CAPA)
  • custom_field_definitions — form/preview fields for each entity type

Idempotent — safe to re-run. Inserts when missing; for existing field
definitions it only re-syncs field_group + display_order (leaving any
user-customised labels / types / picklists intact), matching the behaviour
of scripts/seed_entity_field_defs.py.

Run from repo root:  python3 scripts/seed_qms_module.py
"""
import os
import json
import uuid
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
SYS = "00000000-0000-0000-0000-000000000001"
ORG = "00000000-0000-0000-0000-000000000000"  # system/default org, as used by core modules

MODULE_CODE  = "qms"
MODULE_NAME  = "Quality Management"
MODULE_LABEL = "Quality Management"

# (entity_type_code, label, icon, display_order)
ENTITIES = [
    ("qms_inspections",        "Inspection",        "ClipboardCheck", 10),
    ("qms_nonconformances",    "Non-Conformance",   "AlertTriangle",  20),
    ("qms_corrective_actions", "Corrective Action", "Wrench",         30),
]


def F(name, label, ftype, group, order, picklist=None):
    # `picklist` carries the field's options:
    #   • picklist fields        → a list of string values
    #   • entity_reference fields → {"ref_target": "<entity_type>"}
    return (name, label, ftype, picklist, group, order)


def REF(target):
    return {"ref_target": target}


# Field definitions per entity type. Picklist values are inlined here (same
# storage the rest of the system uses — custom_field_definitions.picklist_values);
# entity_reference fields point at a target entity_type via {"ref_target": ...}.
SCHEMAS = {
    # ─── Inspections (incoming / in-process / final quality checks) ───
    "qms_inspections": [
        F("inspection_number", "Inspection #",    "text",     "Identity",      10),
        F("title",             "Title",           "text",     "Identity",      11),
        F("reference",         "Reference",       "text",     "Identity",      12),
        F("inspector",         "Inspector",       "text",     "Identity",      13),
        F("inspection_type",   "Inspection Type", "picklist", "Classification",20,
          ["Incoming", "In-Process", "Final", "Supplier Audit"]),
        F("inspection_date",   "Inspection Date", "date",     "Timeline",      30),
        F("result",            "Result",          "picklist", "Status",        40,
          ["Pass", "Fail", "Conditional"]),
        F("status",            "Status",          "picklist", "Status",        41,
          ["Draft", "In Progress", "Completed"]),
        F("sample_size",       "Sample Size",     "number",   "Measurement",   50),
        F("defects_found",     "Defects Found",   "number",   "Measurement",   51),
        F("notes",             "Notes",           "textarea", "Notes",         90),
    ],

    # ─── Non-Conformances (NCRs) ───
    "qms_nonconformances": [
        F("ncr_number",     "NCR #",          "text",             "Identity",      10),
        F("title",          "Title",          "text",             "Identity",      11),
        F("inspection_id",  "Source Inspection","entity_reference","Identity",     12,
          REF("qms_inspections")),
        F("reference",      "External Ref",   "text",             "Identity",      13),
        F("product_name",   "Product",        "text",             "Identity",      14),
        F("description",    "Description",    "textarea",         "Identity",      15),
        F("source",         "Source",         "picklist",         "Classification",20,
          ["Inspection", "Customer Complaint", "Internal Audit", "Supplier", "Production"]),
        F("severity",       "Severity",       "picklist",         "Assessment",    30,
          ["Minor", "Major", "Critical"]),
        F("disposition",    "Disposition",    "picklist",         "Status",        40,
          ["Scrap", "Rework", "Use As Is", "Return to Vendor"]),
        F("status",         "Status",         "picklist",         "Status",        41,
          ["Open", "Under Review", "Closed"]),
        F("detected_date",  "Detected Date",  "date",             "Timeline",      50),
        F("notes",          "Notes",          "textarea",         "Notes",         90),
    ],

    # ─── CAPA (Corrective & Preventive Actions) ───
    "qms_corrective_actions": [
        F("capa_number",   "CAPA #",        "text",             "Identity",      10),
        F("title",         "Title",         "text",             "Identity",      11),
        F("ncr_id",        "Source NCR",    "entity_reference", "Identity",      12,
          REF("qms_nonconformances")),
        F("type",          "Type",          "picklist",         "Classification",20,
          ["Corrective", "Preventive"]),
        F("root_cause",    "Root Cause",    "textarea",         "Analysis",      30),
        F("action_plan",   "Action Plan",   "textarea",         "Analysis",      31),
        F("owner",         "Owner",         "text",             "Assignment",    40),
        F("priority",      "Priority",      "picklist",         "Status",        50,
          ["Low", "Medium", "High"]),
        F("status",        "Status",        "picklist",         "Status",        51,
          ["Open", "In Progress", "Verifying", "Closed"]),
        F("due_date",      "Due Date",      "date",             "Timeline",      60),
        F("verification",  "Verification",  "textarea",         "Verification",  70),
        F("notes",         "Notes",         "textarea",         "Notes",         90),
    ],
}


def upsert_module(cur):
    """Insert the qms module row if absent; return its id."""
    cur.execute("SELECT id FROM custom_modules WHERE module_code=%s", (MODULE_CODE,))
    row = cur.fetchone()
    if row:
        return row[0]
    new_id = str(uuid.uuid4())
    cur.execute(
        """
        INSERT INTO custom_modules
            (id, module_code, module_name, module_label, description, icon, color,
             organization_id, is_system_module, is_active, depth, display_order,
             show_in_navigation, created_by, last_modified_by)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, true, true, 0, 85, true, %s, %s)
        RETURNING id
        """,
        (new_id, MODULE_CODE, MODULE_NAME, MODULE_LABEL,
         "Quality management — inspections, non-conformances (NCRs), and CAPA.",
         "ShieldCheck", "#16a34a", ORG, SYS, SYS),
    )
    return cur.fetchone()[0]


def upsert_component(cur, module_id, code, label, icon, order):
    """Insert an entity-type (component) row if absent."""
    cur.execute(
        "SELECT id FROM custom_components WHERE module_id=%s AND component_code=%s",
        (module_id, code),
    )
    if cur.fetchone():
        return 0
    cur.execute(
        """
        INSERT INTO custom_components
            (id, component_code, component_name, component_label, module_id,
             icon, is_active, display_order, created_by, last_modified_by)
        VALUES (%s, %s, %s, %s, %s, %s, true, %s, %s, %s)
        """,
        (str(uuid.uuid4()), code, label, label, module_id, icon, order, SYS, SYS),
    )
    return 1


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()

    module_id = upsert_module(cur)

    comps = 0
    for code, label, icon, order in ENTITIES:
        comps += upsert_component(cur, module_id, code, label, icon, order)

    inserted = updated = 0
    for entity_type, fields in SCHEMAS.items():
        for name, label, ftype, picklist, group, order in fields:
            cur.execute(
                "SELECT id, picklist_values FROM custom_field_definitions "
                "WHERE entity_type=%s AND field_name=%s AND deleted_flag=false",
                (entity_type, name),
            )
            row = cur.fetchone()
            if row is None:
                cur.execute(
                    """
                    INSERT INTO custom_field_definitions
                        (field_name, field_label, field_type, entity_type,
                         is_required, picklist_values, display_order, is_visible,
                         field_group, created_by, last_modified_by)
                    VALUES (%s, %s, %s, %s, false, %s::jsonb, %s, true,
                            %s, %s, %s)
                    ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING
                    """,
                    (name, label, ftype, entity_type,
                     json.dumps(picklist) if picklist else None,
                     order, group, SYS, SYS),
                )
                inserted += cur.rowcount
            else:
                existing_id, existing_pv = row
                # Re-sync grouping/order always; backfill picklist values only
                # when the existing row has none (don't clobber user edits).
                if picklist and existing_pv in (None, [], {}):
                    cur.execute(
                        """
                        UPDATE custom_field_definitions
                           SET field_group     = %s,
                               display_order   = %s,
                               picklist_values = %s::jsonb,
                               last_modified_by   = %s,
                               last_modified_date = NOW()
                         WHERE id = %s
                        """,
                        (group, order, json.dumps(picklist), SYS, existing_id),
                    )
                else:
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
    print(f"QMS module ready (id={module_id}).")
    print(f"  Components inserted: {comps}")
    print(f"  Field definitions:  {inserted} inserted, {updated} regrouped.")


if __name__ == "__main__":
    main()
