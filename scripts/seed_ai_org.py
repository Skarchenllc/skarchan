"""Seed a starter AI org — a CEO, division heads, and unit managers (first-class
ai_workers). Idempotent: skips a role that already exists. Section experts are
left for you to hire per section. Run: python scripts/seed_ai_org.py
"""
import json
import os
import uuid

import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
ORG = "00000000-0000-0000-0000-000000000000"
SYS = "00000000-0000-0000-0000-000000000001"

# (data.module_code, data.entity_type, name, role, persona)
WORKERS = [
    # CEO — top of the org
    ("__org__", "__ceo__", "Casey Vance", "CEO",
     "Pragmatic and decisive. Focuses the company on its few highest-leverage priorities, protects cash and reputation, and escalates only what truly matters."),

    # Division heads
    ("front_office", "__division__", "Riley Hart", "Front Office Head",
     "Customer- and revenue-obsessed; aligns sales, marketing and service around the pipeline and the customer experience."),
    ("finance", "__division__", "Dana Cole", "Finance Head",
     "Risk-averse and compliance-first; protects cash, watches the numbers, and flags anomalies early."),
    ("supply_chain", "__division__", "Sam Okafor", "Supply Chain Head",
     "Reliability- and cost-focused; keeps inventory and procurement flowing without surprises."),
    ("production", "__division__", "Pat Nguyen", "Production Head",
     "Quality- and throughput-driven; balances output with standards and safety."),
    ("people", "__division__", "Jordan Ellis", "People Head",
     "People-first; protects talent, culture and compliance across the workforce."),
    ("projects_governance", "__division__", "Morgan Reyes", "Projects & Governance Head",
     "Delivery- and governance-minded; keeps projects on track and the org compliant and well-run."),

    # Unit managers — one per AI-enabled module
    ("sales", "__manager__", "Alex Stone", "Sales Manager",
     "Closes deals; prioritises the highest-value opportunities and keeps the pipeline moving."),
    ("marketing", "__manager__", "Robin Park", "Marketing Manager",
     "Demand- and brand-focused; nurtures leads and measures what works."),
    ("accounting", "__manager__", "Quinn Avery", "Accounting Manager",
     "Precise and controls-minded; keeps the books accurate and timely."),
    ("inventory", "__manager__", "Drew Bauer", "Inventory Manager",
     "Keeps stock accurate and available; prevents shortages and dead stock."),
    ("production", "__manager__", "Lee Maddox", "Production Manager",
     "Runs the floor; balances schedule, quality and cost."),
    ("hr", "__manager__", "Taylor Brooks", "HR Manager",
     "Supports employees end to end — hiring, onboarding, and compliance."),
    ("pm", "__manager__", "Cameron Webb", "Project Manager",
     "Drives projects to done; manages scope, milestones and owners."),
    ("administration", "__manager__", "Avery Lloyd", "Administration Manager",
     "Keeps the org compliant and running — contracts, risk and governance."),
]


def _label(entity_type: str, module: str) -> str:
    s = entity_type[len(module) + 1:] if entity_type.startswith(module + "_") else entity_type
    return s.replace("_", " ").title()


def _insert_worker(cur, module_code, entity_type, name, role, persona):
    cur.execute(
        "SELECT 1 FROM entity_records WHERE entity_type='ai_workers' AND is_deleted='N' "
        "AND data->>'module_code'=%s AND data->>'entity_type'=%s",
        (module_code, entity_type),
    )
    if cur.fetchone():
        return False
    data = {
        "module_code": module_code, "entity_type": entity_type,
        "name": name, "role": role, "persona": persona,
        "autonomy": "review", "capabilities": [], "kpis": [], "enabled": True,
    }
    cur.execute(
        "INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, "
        "created_by, last_modified_by, is_deleted, created_at, last_modified_at) "
        "VALUES (%s,'ai_workers','core',%s::jsonb,%s,%s,%s,'N',NOW(),NOW())",
        (str(uuid.uuid4()), json.dumps(data), ORG, SYS, SYS),
    )
    return True


def staff_sections(cur):
    """Hire a role-named expert for every AI-enabled section (the unit managers' teams)."""
    cur.execute(
        "SELECT data->>'module_code', data->>'entity_type' FROM entity_records "
        "WHERE entity_type='ai_settings' AND data->>'module_code'<>'__global__' "
        "AND (data->>'enabled')='true' ORDER BY 1,2"
    )
    created = skipped = 0
    for module_code, entity_type in cur.fetchall():
        label = _label(entity_type, module_code)
        name = f"{label} Specialist"
        role = f"{label.lower()} specialist"
        persona = (f"Specialist for the {label} section in {module_code}. Knows this data deeply, "
                   f"surfaces issues early, and handles every change carefully.")
        if _insert_worker(cur, module_code, entity_type, name, role, persona):
            created += 1
            print(f"  + {name:34s} ({module_code}/{entity_type})")
        else:
            skipped += 1
    return created, skipped


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()
    created = skipped = 0
    print("Leadership (CEO · division heads · unit managers):")
    for module_code, entity_type, name, role, persona in WORKERS:
        cur.execute(
            "SELECT 1 FROM entity_records WHERE entity_type='ai_workers' AND is_deleted='N' "
            "AND data->>'module_code'=%s AND data->>'entity_type'=%s",
            (module_code, entity_type),
        )
        if cur.fetchone():
            skipped += 1
            continue
        data = {
            "module_code": module_code, "entity_type": entity_type,
            "name": name, "role": role, "persona": persona,
            "autonomy": "review", "capabilities": [], "kpis": [], "enabled": True,
        }
        cur.execute(
            "INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, "
            "created_by, last_modified_by, is_deleted, created_at, last_modified_at) "
            "VALUES (%s,'ai_workers','core',%s::jsonb,%s,%s,%s,'N',NOW(),NOW())",
            (str(uuid.uuid4()), json.dumps(data), ORG, SYS, SYS),
        )
        created += 1
        print(f"  + {name:14s} {role:28s} ({module_code}/{entity_type})")

    print("\nSection experts (the unit managers' teams):")
    sc, ss = staff_sections(cur)
    created += sc
    skipped += ss

    conn.commit()
    cur.close()
    conn.close()
    print(f"\nDone. Created {created} workers, skipped {skipped} existing.")


if __name__ == "__main__":
    main()
