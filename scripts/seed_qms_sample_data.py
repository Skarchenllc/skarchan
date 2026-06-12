#!/usr/bin/env python3
"""
Seed sample QMS records (inspections, NCRs, CAPA) into entity_records so the
module and the control-room dashboard show real data and working cross-links.

Idempotent: clears existing module_code='qms' records, then inserts a fresh set.
Run from repo root:  python3 scripts/seed_qms_sample_data.py
"""
import os
import uuid
import json
import psycopg2
from datetime import date, timedelta

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
ORG = "00000000-0000-0000-0000-000000000000"
SYS = "00000000-0000-0000-0000-000000000001"

today = date.today()
def d(offset):  # ISO date offset in days from today
    return (today + timedelta(days=offset)).isoformat()


def main():
    conn = psycopg2.connect(DSN)
    cur = conn.cursor()

    # Reset existing QMS sample data.
    cur.execute("DELETE FROM entity_records WHERE module_code='qms'")

    def insert(entity_type, data, created_offset):
        rid = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO entity_records
                (id, entity_type, module_code, data, organization_id,
                 created_at, created_by, last_modified_at, last_modified_by, is_deleted)
            VALUES (%s, %s, 'qms', %s::jsonb, %s,
                    NOW() + (%s || ' days')::interval, %s, NOW(), %s, 'N')
            """,
            (rid, entity_type, json.dumps(data), ORG, created_offset, SYS, SYS),
        )
        return rid

    # ── Inspections ──────────────────────────────────────────────
    inspections = [
        dict(inspection_number="INS-1001", title="Incoming raw material check", reference="PO-5001",
             inspector="A. Khan", inspection_type="Incoming", inspection_date=d(-20),
             result="Pass", status="Completed", sample_size=50, defects_found=0),
        dict(inspection_number="INS-1002", title="In-process weld inspection", reference="WO-3007",
             inspector="M. Patel", inspection_type="In-Process", inspection_date=d(-14),
             result="Fail", status="Completed", sample_size=30, defects_found=4),
        dict(inspection_number="INS-1003", title="Final QA - Batch B-220", reference="WO-3010",
             inspector="S. Roy", inspection_type="Final", inspection_date=d(-9),
             result="Conditional", status="Completed", sample_size=40, defects_found=2),
        dict(inspection_number="INS-1004", title="Supplier audit - Acme Components", reference="SUP-12",
             inspector="A. Khan", inspection_type="Supplier Audit", inspection_date=d(-5),
             result="Fail", status="Completed", sample_size=25, defects_found=6),
        dict(inspection_number="INS-1005", title="Incoming fasteners check", reference="PO-5009",
             inspector="M. Patel", inspection_type="Incoming", inspection_date=d(-2),
             result="Pass", status="Completed", sample_size=60, defects_found=1),
        dict(inspection_number="INS-1006", title="In-process coating inspection", reference="WO-3015",
             inspector="S. Roy", inspection_type="In-Process", inspection_date=d(0),
             result="", status="In Progress", sample_size=20, defects_found=0),
    ]
    ins_ids = [insert("qms_inspections", x, -22 + i * 3) for i, x in enumerate(inspections)]

    # ── Non-Conformances (linked to failing inspections) ─────────
    ncrs = [
        dict(ncr_number="NCR-2001", title="Weld porosity exceeds spec", inspection_id=ins_ids[1],
             reference="WO-3007", product_name="Frame Assembly", description="4 of 30 welds show porosity above AWS limit.",
             source="Inspection", severity="Major", disposition="Rework", status="Open", detected_date=d(-14)),
        dict(ncr_number="NCR-2002", title="Out-of-tolerance dimensions", inspection_id=ins_ids[2],
             reference="WO-3010", product_name="Bracket B-220", description="2 units out of tolerance on hole spacing.",
             source="Inspection", severity="Minor", disposition="Use As Is", status="Under Review", detected_date=d(-9)),
        dict(ncr_number="NCR-2003", title="Supplier lot contamination", inspection_id=ins_ids[3],
             reference="SUP-12", product_name="Bearing Set", description="Contaminated lot from Acme Components.",
             source="Supplier", severity="Critical", disposition="Return to Vendor", status="Open", detected_date=d(-5)),
        dict(ncr_number="NCR-2004", title="Customer complaint - finish defect", inspection_id="",
             reference="CASE-880", product_name="Panel P-12", description="Customer reported surface scratches.",
             source="Customer Complaint", severity="Minor", disposition="Scrap", status="Closed", detected_date=d(-25)),
    ]
    ncr_ids = [insert("qms_nonconformances", x, -16 + i * 3) for i, x in enumerate(ncrs)]

    # ── CAPA (linked to NCRs; some overdue to populate the action center) ──
    capas = [
        dict(capa_number="CAPA-3001", title="Revise weld procedure & retrain", ncr_id=ncr_ids[0],
             type="Corrective", root_cause="Inadequate shielding gas flow.", action_plan="Update WPS; retrain welders; add flow check.",
             owner="M. Patel", priority="High", status="In Progress", due_date=d(-3),
             verification=""),
        dict(capa_number="CAPA-3002", title="Adjust fixture tolerances", ncr_id=ncr_ids[1],
             type="Corrective", root_cause="Worn drill fixture.", action_plan="Replace fixture; add monthly calibration.",
             owner="S. Roy", priority="Medium", status="Verifying", due_date=d(5),
             verification="Pending effectiveness check on next batch."),
        dict(capa_number="CAPA-3003", title="Supplier corrective action request", ncr_id=ncr_ids[2],
             type="Preventive", root_cause="Supplier cleanroom lapse.", action_plan="Issue SCAR; require incoming cleanliness cert.",
             owner="A. Khan", priority="High", status="Open", due_date=d(-1),
             verification=""),
    ]
    for i, x in enumerate(capas):
        insert("qms_corrective_actions", x, -12 + i * 3)

    conn.commit()
    cur.close()
    conn.close()
    print(f"Seeded {len(ins_ids)} inspections, {len(ncr_ids)} NCRs, {len(capas)} CAPA.")


if __name__ == "__main__":
    main()
