#!/usr/bin/env python3
"""
Seed dummy data across every major entity type so the dashboards and lists
have something realistic to render during testing.

Idempotent: skips entities that already have >= 3 active records. To force a
re-seed, delete the existing rows for the entity_type first.

Run from the repo root:
  python3 scripts/seed_dummy_data.py
"""
import os
import json
import random
import uuid
from datetime import date, datetime, timedelta

import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
ORG = "00000000-0000-0000-0000-000000000000"
SYS = "00000000-0000-0000-0000-000000000001"

# ────────────────────────── data pools ──────────────────────────
FIRST_NAMES = ["Aaron","Ava","Bilal","Carla","Daniel","Eli","Fatima","George","Hira","Ian",
               "Julia","Khalid","Laila","Mark","Naomi","Omar","Priya","Qasim","Rosa","Sara",
               "Tariq","Uma","Vince","Wendy","Xavier","Yara","Zane"]
LAST_NAMES  = ["Ahmed","Brown","Chen","Diaz","Evans","Farooq","Garcia","Hussain","Iqbal","Johnson",
               "Khan","Lopez","Malik","Nguyen","O'Brien","Patel","Qureshi","Rao","Singh","Taylor",
               "Usmani","Vargas","Williams","Xu","Yamamoto","Zaidi"]
COMPANIES = ["Acme Holdings","Beacon Capital","Crestline Industries","Delta Logistics","Evergreen Foods",
             "Forge Steel","Gemini Pharma","Helix Networks","Ironclad Security","Junction Retail",
             "Kestrel Aviation","Lumen Energy","Meridian Bank","Nexus Robotics","Olympus Media",
             "Pinnacle Health","Quantum Analytics","Riverstone Estates","Summit Auto","Trident Marine"]
DEPARTMENTS = ["Engineering","Finance","Operations","Sales","Marketing","HR","Customer Service","R&D","Legal","IT"]
PRODUCTS = ["Pro Toolkit","Starter Bundle","Enterprise Suite","Mobile Add-on","Cloud Backup",
            "Analytics Module","Security Pack","API Gateway","Workflow Automation","Reporting Plus"]
CITIES = ["Karachi","Lahore","Islamabad","Dubai","London","Singapore","New York","Sydney","Tokyo","Toronto"]

def rand_name(): return f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
def rand_email(name=None):
    n = (name or rand_name()).lower().replace("'", "").replace(" ", ".")
    return f"{n}@{random.choice(['example.com','acme.io','corp.local','mail.test'])}"
def rand_phone(): return f"+{random.randint(1,99):02d}-{random.randint(100,999)}-{random.randint(1000,9999)}"
def rand_amount(lo, hi): return round(random.uniform(lo, hi), 2)
def rand_date(days_back=180, days_forward=0):
    delta = random.randint(-days_back, days_forward)
    return (date.today() + timedelta(days=delta)).isoformat()

# ────────────────────────── inserter ──────────────────────────
def insert(cur, entity_type, records, module_code=None):
    """Insert records (list of dicts) into entity_records for given entity_type."""
    # Skip if already populated (>=3 active records)
    cur.execute(
        "SELECT COUNT(*) FROM entity_records WHERE entity_type=%s AND is_deleted='N'",
        (entity_type,),
    )
    existing = cur.fetchone()[0]
    if existing >= 3:
        return 0, existing
    inserted = 0
    for rec in records:
        rec_id = str(uuid.uuid4())
        cur.execute(
            """
            INSERT INTO entity_records
                (id, entity_type, data, organization_id,
                 created_by, created_at, last_modified_by, last_modified_at,
                 is_deleted, module_code)
            VALUES (%s, %s, %s::jsonb, %s, %s, NOW(), %s, NOW(), 'N', %s)
            """,
            (rec_id, entity_type, json.dumps(rec), ORG, SYS, SYS, module_code),
        )
        inserted += 1
        # Capture the id in the record so the next entity can reference it.
        rec["_id"] = rec_id
    return inserted, existing


# ────────────────────────── builders ──────────────────────────
def build_customers():
    out = []
    for i, c in enumerate(COMPANIES[:12]):
        out.append({
            "name": c,
            "type": random.choice(["Business", "Individual"]),
            "email": f"contact@{c.lower().replace(' ','')}.com",
            "phone": rand_phone(),
            "address": f"{random.randint(10,999)} {random.choice(['Main','Park','First','Market'])} St, {random.choice(CITIES)}",
            "status": random.choice(["Active", "Active", "Active", "Inactive", "Prospect"]),
            "annual_revenue": rand_amount(50000, 5000000),
            "lifetime_value": rand_amount(20000, 2000000),
        })
    return out

def build_vendors():
    out = []
    pool = ["Office Supply Co", "Cloud Hosting Ltd", "Logistics Express", "Tech Distributors",
            "Marketing Agency", "Industrial Equipment", "Catering Services", "Legal Counsel LLC",
            "Cleaning Services", "Security Solutions", "Hardware Wholesale", "Print Shop"]
    for v in pool:
        out.append({
            "name": v,
            "type": random.choice(["Supplier", "Service Provider", "Contractor", "Consultant"]),
            "email": f"ap@{v.lower().replace(' ','')}.com",
            "phone": rand_phone(),
            "status": random.choice(["Active", "Active", "Inactive"]),
            "payment_terms": random.choice(["Net 30", "Net 60", "Due on receipt", "Net 15"]),
        })
    return out

def build_accounts():
    return [
        {"name": "Cash on Hand",          "code": "1000", "account_type": "Assets",      "balance": 125000, "status": "Active"},
        {"name": "Accounts Receivable",   "code": "1100", "account_type": "Assets",      "balance": 340000, "status": "Active"},
        {"name": "Inventory",             "code": "1200", "account_type": "Assets",      "balance": 215000, "status": "Active"},
        {"name": "Fixed Assets",          "code": "1500", "account_type": "Assets",      "balance": 780000, "status": "Active"},
        {"name": "Accounts Payable",      "code": "2000", "account_type": "Liabilities", "balance": 95000,  "status": "Active"},
        {"name": "Short-term Loans",      "code": "2100", "account_type": "Liabilities", "balance": 180000, "status": "Active"},
        {"name": "Long-term Debt",        "code": "2500", "account_type": "Liabilities", "balance": 425000, "status": "Active"},
        {"name": "Owner's Equity",        "code": "3000", "account_type": "Equity",      "balance": 660000, "status": "Active"},
        {"name": "Retained Earnings",     "code": "3100", "account_type": "Equity",      "balance": 100000, "status": "Active"},
        {"name": "Product Sales",         "code": "4000", "account_type": "Revenue",     "balance": 1450000,"status": "Active"},
        {"name": "Service Revenue",       "code": "4100", "account_type": "Revenue",     "balance": 620000, "status": "Active"},
        {"name": "Cost of Goods Sold",    "code": "5000", "account_type": "Expenses",    "balance": 740000, "status": "Active"},
        {"name": "Salaries & Wages",      "code": "6000", "account_type": "Expenses",    "balance": 480000, "status": "Active"},
        {"name": "Rent",                  "code": "6100", "account_type": "Expenses",    "balance": 96000,  "status": "Active"},
        {"name": "Utilities",             "code": "6200", "account_type": "Expenses",    "balance": 34000,  "status": "Active"},
        {"name": "Marketing",             "code": "6300", "account_type": "Expenses",    "balance": 85000,  "status": "Active"},
    ]

def build_invoices(customers):
    out = []
    statuses = ["Draft","Sent","Paid","Paid","Paid","Partially Paid","Overdue","Cancelled"]
    for i in range(20):
        c = random.choice(customers)
        amt = rand_amount(500, 25000)
        issued = rand_date(120, 0)
        due = (date.fromisoformat(issued) + timedelta(days=30)).isoformat()
        out.append({
            "invoice_number": f"INV-2026-{1000+i:04d}",
            "customer_name": c["name"],
            "customer_id": c.get("_id"),
            "amount": amt,
            "tax": round(amt * 0.05, 2),
            "total": round(amt * 1.05, 2),
            "issue_date": issued,
            "due_date": due,
            "status": random.choice(statuses),
        })
    return out

def build_bills(vendors):
    out = []
    for i in range(15):
        v = random.choice(vendors)
        amt = rand_amount(200, 12000)
        issued = rand_date(90, 0)
        out.append({
            "bill_number": f"BILL-2026-{500+i:04d}",
            "vendor_name": v["name"],
            "vendor_id": v.get("_id"),
            "amount": amt,
            "issue_date": issued,
            "due_date": (date.fromisoformat(issued) + timedelta(days=30)).isoformat(),
            "status": random.choice(["Draft","Approved","Paid","Paid","Overdue"]),
        })
    return out

def build_transactions(accounts):
    out = []
    for i in range(40):
        debit = random.choice(accounts)
        credit = random.choice([a for a in accounts if a["code"] != debit["code"]])
        amt = rand_amount(50, 25000)
        out.append({
            "transaction_number": f"TXN-{10000+i:05d}",
            "date": rand_date(60, 0),
            "transaction_date": rand_date(60, 0),
            "amount": amt,
            "type": random.choice(["Debit", "Credit"]),
            "status": random.choice(["Pending", "Posted", "Posted", "Posted"]),
            "account_type": random.choice(["Assets","Liabilities","Equity","Revenue","Expenses"]),
            "debit_account_id": debit.get("_id"),
            "credit_account_id": credit.get("_id"),
            "reference": f"Journal entry {i+1}",
        })
    return out

def build_employees():
    out = []
    statuses = ["active","active","active","active","on_leave","terminated"]
    for i in range(20):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        out.append({
            "first_name": first,
            "last_name": last,
            "employee_code": f"EMP-{1000+i:04d}",
            "email": rand_email(f"{first}.{last}"),
            "phone": rand_phone(),
            "department_id": random.choice(DEPARTMENTS),
            "job_title": random.choice(["Engineer","Manager","Analyst","Director","Specialist","Coordinator","Lead","Associate"]),
            "hire_date": rand_date(1500, 0),
            "base_salary": rand_amount(35000, 180000),
            "employment_status": random.choice(statuses),
            "employment_type": random.choice(["Full-time","Full-time","Full-time","Part-time","Contractor"]),
            "status": "Active",
        })
    return out

def build_leave_requests(employees):
    out = []
    for i in range(12):
        e = random.choice(employees)
        start = date.today() + timedelta(days=random.randint(-30, 45))
        days = random.randint(1, 7)
        out.append({
            "employee_id": e.get("_id"),
            "employee_name": f"{e['first_name']} {e['last_name']}",
            "leave_type": random.choice(["Annual","Sick","Personal","Maternity","Paternity"]),
            "start_date": start.isoformat(),
            "end_date": (start + timedelta(days=days-1)).isoformat(),
            "total_days": days,
            "status": random.choice(["Pending","Approved","Approved","Rejected","Cancelled"]),
            "reason": random.choice(["Family event","Medical","Vacation","Personal matter","Conference"]),
        })
    return out

def build_attendance(employees):
    out = []
    for e in random.sample(employees, min(15, len(employees))):
        out.append({
            "employee_id": e.get("_id"),
            "attendance_date": date.today().isoformat(),
            "status": random.choice(["present","present","present","present","absent","late","leave"]),
            "total_hours": random.choice([8, 8, 8, 7.5, 9, 4]),
            "check_in": "09:00",
            "check_out": "17:30",
        })
    return out

def build_leads():
    out = []
    statuses = ["New","Contacted","Qualified","Qualified","Unqualified","Converted"]
    for i in range(15):
        name = rand_name()
        out.append({
            "name": name,
            "email": rand_email(name),
            "phone": rand_phone(),
            "company_name": random.choice(COMPANIES),
            "status": random.choice(statuses),
            "source": random.choice(["Website","Referral","Cold Call","Trade Show","Social","Other"]),
            "estimated_value": rand_amount(1000, 50000),
        })
    return out

def build_opportunities(customers):
    out = []
    stages = ["Prospecting","Qualified","Proposal","Negotiation","Closed Won","Closed Lost"]
    for i in range(15):
        c = random.choice(customers)
        out.append({
            "name": f"{random.choice(PRODUCTS)} for {c['name']}",
            "subject": f"Deal: {c['name']}",
            "account_id": c.get("_id"),
            "account_name": c["name"],
            "amount": rand_amount(5000, 150000),
            "stage": random.choice(stages),
            "priority": random.choice(["Low","Medium","High"]),
            "close_date": rand_date(0, 90),
            "probability": random.randint(10, 95),
        })
    return out

def build_contacts(customers):
    out = []
    for _ in range(20):
        c = random.choice(customers)
        name = rand_name()
        out.append({
            "first_name": name.split()[0],
            "last_name": name.split()[1],
            "email": rand_email(name),
            "phone": rand_phone(),
            "company_name": c["name"],
            "title": random.choice(["CEO","CFO","CTO","Manager","Director","VP","Analyst"]),
            "status": "Active",
        })
    return out

def build_campaigns():
    out = []
    for i, name in enumerate(["Q1 Email Blast","Spring Promo","Webinar Series","Customer Reactivation",
                              "Product Launch","Holiday Sale","Brand Awareness","Trade Show 2026"]):
        out.append({
            "name": name,
            "type": random.choice(["Email","Social","Paid Ads","Event","Content"]),
            "status": random.choice(["Active","Draft","Paused","Completed"]),
            "start_date": rand_date(60, 0),
            "end_date": rand_date(0, 90),
            "budget": rand_amount(5000, 75000),
            "leads_generated": random.randint(0, 250),
            "conversions": random.randint(0, 40),
        })
    return out

def build_content():
    out = []
    titles = ["10 Ways to Boost Productivity","The Future of Cloud Computing","Customer Success Stories",
             "Industry Trends 2026","Product Update: Release Notes","Webinar Recap","How-To Guide",
             "Case Study: Acme Holdings","Newsletter Issue #12","Whitepaper: Data Security"]
    for t in titles:
        out.append({
            "title": t,
            "subject": t,
            "content_type": random.choice(["Article","Blog","Video","Image","Whitepaper"]),
            "status": random.choice(["Draft","Review","Published","Published","Archived"]),
            "views": random.randint(0, 5000),
            "shares": random.randint(0, 200),
        })
    return out

def build_projects():
    out = []
    pool = ["Cloud Migration","Mobile App Refresh","CRM Implementation","Office Renovation",
            "ERP Rollout","Website Redesign","Analytics Pipeline","Compliance Audit",
            "Customer Portal","Inventory Modernization","AI Chatbot","Security Hardening"]
    for p in pool:
        out.append({
            "name": p,
            "title": p,
            "status": random.choice(["Planning","Active","Active","On Hold","Completed"]),
            "priority": random.choice(["Low","Medium","High","Critical"]),
            "start_date": rand_date(120, 0),
            "end_date": rand_date(0, 180),
            "budget": rand_amount(20000, 500000),
            "owner": rand_name(),
        })
    return out

def build_tasks(projects):
    out = []
    pool = ["Set up environment","Write specs","Design mockups","Build prototype","Code review",
           "User testing","Deploy to staging","Bug fixes","Documentation","Stakeholder sign-off",
           "Performance tuning","Security review","Migration script","Training session","Final QA"]
    for i in range(40):
        p = random.choice(projects) if projects else None
        out.append({
            "name": f"{random.choice(pool)} - {random.choice(['Phase 1','Phase 2','Sprint A','Sprint B'])}",
            "title": random.choice(pool),
            "project_id": p.get("_id") if p else None,
            "project_name": p["name"] if p else None,
            "status": random.choice(["Todo","Todo","In Progress","In Progress","Done","Blocked"]),
            "priority": random.choice(["Low","Medium","High","Critical"]),
            "due_date": rand_date(0, 60),
            "assignee": rand_name(),
        })
    return out

def build_milestones(projects):
    out = []
    for i in range(12):
        p = random.choice(projects) if projects else None
        out.append({
            "name": f"Milestone {i+1}: {random.choice(['Discovery','Build','UAT','Launch','Review'])}",
            "title": f"Milestone {i+1}",
            "project_id": p.get("_id") if p else None,
            "due_date": rand_date(0, 90),
            "status": random.choice(["Planned","In Progress","Achieved","Missed"]),
        })
    return out

def build_service_tickets():
    out = []
    issues = ["Login issue","Payment failed","Cannot export data","Slow performance","Feature request",
              "Account locked","Invoice question","Integration error","Missing data","UI bug"]
    for i in range(15):
        out.append({
            "ticket_number": f"TIC-{2000+i:04d}",
            "subject": random.choice(issues),
            "title": random.choice(issues),
            "customer_name": random.choice(COMPANIES),
            "status": random.choice(["New","In Progress","In Progress","Pending","Resolved","Closed"]),
            "priority": random.choice(["Low","Medium","Medium","High","Urgent"]),
            "category": random.choice(["Technical","Billing","Account","General"]),
            "created_date": rand_date(30, 0),
        })
    return out

def build_stock_items():
    out = []
    for i, sku in enumerate(PRODUCTS * 2):
        out.append({
            "name": f"{sku} {chr(65+i%5)}",
            "sku": f"SKU-{1000+i:04d}",
            "category": random.choice(["Physical","Digital","Service"]),
            "quantity": random.randint(0, 500),
            "price": rand_amount(10, 2500),
            "cost": rand_amount(5, 1500),
            "status": random.choice(["In Stock","In Stock","Low Stock","Out of Stock"]),
        })
    return out

def build_warehouses():
    out = []
    for c in CITIES[:5]:
        out.append({
            "name": f"{c} Warehouse",
            "code": f"WH-{c[:3].upper()}",
            "address": f"Industrial Zone, {c}",
            "status": random.choice(["Active","Active","Active","Under Maintenance"]),
            "capacity_units": random.randint(5000, 50000),
        })
    return out

def build_products():
    out = []
    for p in PRODUCTS:
        out.append({
            "name": p,
            "sku": f"SKU-{abs(hash(p))%10000:04d}",
            "category": random.choice(["Physical","Digital","Service"]),
            "price": rand_amount(50, 5000),
            "stock": random.randint(0, 200),
            "is_active": True,
        })
    return out

def build_purchase_orders(vendors):
    out = []
    for i in range(12):
        v = random.choice(vendors)
        out.append({
            "po_number": f"PO-{3000+i:04d}",
            "vendor_id": v.get("_id"),
            "vendor_name": v["name"],
            "order_date": rand_date(60, 0),
            "expected_date": rand_date(0, 30),
            "amount": rand_amount(500, 50000),
            "status": random.choice(["Draft","Sent","Acknowledged","Received","Closed"]),
        })
    return out

def build_risks():
    out = []
    titles = ["Supply chain disruption","Cybersecurity breach","Currency fluctuation","Regulatory change",
              "Key personnel departure","Vendor bankruptcy","Data center outage","Compliance gap"]
    for t in titles:
        out.append({
            "title": t,
            "category": random.choice(["Operational","Financial","Strategic","Compliance","Technology"]),
            "likelihood": random.choice(["Low","Medium","High"]),
            "impact": random.choice(["Low","Medium","High"]),
            "status": random.choice(["Identified","Mitigating","Accepted"]),
            "mitigation": "Documented mitigation plan in risk register.",
        })
    return out

def build_licenses():
    out = []
    for name in ["Business Operating License","Software License - Enterprise","ISO 27001 Certification",
                 "Import/Export Permit","Environmental Permit","Tax Registration","Trade License"]:
        out.append({
            "name": name,
            "title": name,
            "license_type": random.choice(["Operational","Regulatory","Certification","Permit"]),
            "issue_date": rand_date(700, 0),
            "expires_at": rand_date(0, 365),
            "status": random.choice(["Active","Active","Pending Renewal","Expired"]),
            "issuing_authority": random.choice(["Government","Industry Body","Certifying Org"]),
        })
    return out

def build_board_meetings():
    out = []
    for i in range(8):
        meeting_date = date.today() + timedelta(days=random.randint(-180, 60))
        out.append({
            "title": f"Q{random.randint(1,4)} {meeting_date.year} Board Meeting",
            "meeting_date": meeting_date.isoformat(),
            "meeting_type": random.choice(["Annual","Quarterly","Special","Emergency"]),
            "status": "Completed" if meeting_date < date.today() else "Scheduled",
            "location": random.choice(["HQ Boardroom","Virtual","Off-site"]),
        })
    return out

def build_insurance_policies():
    out = []
    for name, t in [("General Liability","Liability"),("Property Coverage","Property"),
                    ("Cyber Insurance","Cyber"),("Workers' Comp","Workers Compensation"),
                    ("D&O Insurance","Directors & Officers"),("Auto Fleet","Vehicle")]:
        out.append({
            "name": name,
            "title": name,
            "policy_number": f"POL-{random.randint(100000,999999)}",
            "coverage_type": t,
            "premium": rand_amount(2000, 80000),
            "start_date": rand_date(365, 0),
            "renewal_date": rand_date(0, 365),
            "expires_at": rand_date(0, 365),
            "status": random.choice(["Active","Active","Active","Pending"]),
        })
    return out

def build_contracts(customers):
    out = []
    for i in range(10):
        c = random.choice(customers)
        start = date.today() + timedelta(days=random.randint(-300, 0))
        out.append({
            "contract_number": f"CTR-{4000+i:04d}",
            "title": f"Service Agreement - {c['name']}",
            "party": c["name"],
            "value": rand_amount(10000, 500000),
            "start_date": start.isoformat(),
            "end_date": (start + timedelta(days=365)).isoformat(),
            "renewal_date": (start + timedelta(days=335)).isoformat(),
            "status": random.choice(["Draft","Active","Active","Expired","Renewed"]),
        })
    return out

def build_credentials():
    out = []
    services = ["GitHub","AWS","Stripe","SendGrid","Slack","Database Prod","SSH Bastion","Cloudflare"]
    for s in services:
        out.append({
            "name": f"{s} - Service Account",
            "service": s,
            "username": f"svc-{s.lower().replace(' ','-')}",
            "category": random.choice(["API Key","Service Account","Database","SSH Key","Web Login"]),
            "expires_at": rand_date(0, 365),
            "is_active": True,
        })
    return out

def build_documents():
    out = []
    for title in ["Employee Handbook","Privacy Policy","Disaster Recovery Plan","Vendor Onboarding Doc",
                  "Q4 Financial Report","ISO Audit Report","Code of Conduct","Brand Guidelines"]:
        out.append({
            "title": title,
            "category": random.choice(["Policy","Contract","Report","Manual"]),
            "version": f"1.{random.randint(0,9)}",
            "uploaded_date": rand_date(180, 0),
        })
    return out

def build_applications():
    out = []
    for i in range(12):
        name = rand_name()
        out.append({
            "name": name,
            "first_name": name.split()[0],
            "last_name": name.split()[1],
            "email": rand_email(name),
            "phone": rand_phone(),
            "job_title": random.choice(["Software Engineer","Product Manager","Designer","Analyst","HR Specialist"]),
            "status": random.choice(["Applied","Applied","Screening","Interviewing","Offered","Hired","Rejected"]),
            "applied_date": rand_date(60, 0),
            "source": random.choice(["LinkedIn","Referral","Job Board","Career Page","Recruiter"]),
        })
    return out

def build_subscriptions():
    out = []
    for v, p in [("Atlassian","Jira"),("Slack","Slack Pro"),("Microsoft","365 Business"),
                 ("Zoom","Pro"),("AWS","Cloud Hosting"),("Adobe","Creative Cloud"),
                 ("Notion","Team"),("DocuSign","Business")]:
        renew = date.today() + timedelta(days=random.randint(-30, 365))
        out.append({
            "vendor": v,
            "product_name": p,
            "cost": rand_amount(10, 5000),
            "billing_cycle": random.choice(["Monthly","Quarterly","Annual"]),
            "start_date": rand_date(700, -30),
            "renewal_date": renew.isoformat(),
            "status": random.choice(["Active","Active","Active","Cancelled","Trial"]),
        })
    return out

def build_assets():
    out = []
    for i in range(12):
        out.append({
            "asset_tag": f"AST-{1000+i:04d}",
            "name": random.choice(["MacBook Pro","ThinkPad","iMac","Office Chair","Standing Desk",
                                   "Server Rack","Forklift","Company Vehicle","Projector","Network Switch"]),
            "category": random.choice(["Equipment","Vehicle","IT Hardware","Furniture","Other"]),
            "value": rand_amount(300, 35000),
            "purchase_date": rand_date(1000, 0),
            "location": random.choice(CITIES),
            "status": random.choice(["Active","Active","In Maintenance","Retired"]),
        })
    return out

def build_sales_accounts(customers):
    """CRM accounts = customer companies. Copies from customers with CRM fields."""
    out = []
    for c in customers:
        out.append({
            "name": c["name"],
            "account_name": c["name"],
            "type": random.choice(["Prospect","Customer","Partner"]),
            "industry": random.choice(["Technology","Finance","Healthcare","Manufacturing","Retail"]),
            "annual_revenue": c.get("annual_revenue", 0),
            "phone": c.get("phone"),
            "email": c.get("email"),
            "status": "Active",
        })
    return out

def build_quotes(customers):
    out = []
    for i in range(12):
        c = random.choice(customers)
        amt = rand_amount(500, 50000)
        out.append({
            "quote_number": f"QUO-{6000+i:04d}",
            "customer_id": c.get("_id"),
            "customer_name": c["name"],
            "amount": amt,
            "total_amount": round(amt * 1.05, 2),
            "issue_date": rand_date(60, 0),
            "valid_until": rand_date(0, 30),
            "status": random.choice(["Draft","Sent","Sent","Accepted","Rejected","Expired"]),
        })
    return out

def build_orders(customers):
    out = []
    for i in range(15):
        c = random.choice(customers)
        amt = rand_amount(200, 35000)
        out.append({
            "order_number": f"ORD-{7000+i:04d}",
            "customer_id": c.get("_id"),
            "customer_name": c["name"],
            "amount": amt,
            "total_amount": round(amt * 1.05, 2),
            "order_date": rand_date(60, 0),
            "status": random.choice(["Pending","Paid","Paid","Shipped","Delivered","Cancelled"]),
        })
    return out

def build_bank_accounts():
    out = []
    for name, t in [("Operating Checking","Checking"),("Payroll Account","Checking"),
                    ("Reserve Savings","Savings"),("Corporate Credit","Credit Card"),
                    ("Investment Account","Investment"),("Petty Cash","Cash")]:
        out.append({
            "name": name,
            "account_number": f"****{random.randint(1000,9999)}",
            "bank_name": random.choice(["Chase","Wells Fargo","Citi","BOA","HSBC"]),
            "account_type": t,
            "balance": rand_amount(500, 500000),
            "status": "Active",
        })
    return out

def build_payroll_runs(employees):
    out = []
    for i in range(6):
        period_end = date.today() - timedelta(days=30*(6-i))
        out.append({
            "name": f"Payroll - {period_end.strftime('%b %Y')}",
            "title": f"Payroll Run {period_end.strftime('%b %Y')}",
            "period_start": (period_end - timedelta(days=30)).isoformat(),
            "period_end": period_end.isoformat(),
            "total_employees": len(employees),
            "total_amount": rand_amount(50000, 500000),
            "status": random.choice(["Processed","Paid","Paid","Paid"]) if i < 5 else "Draft",
        })
    return out

def build_payslips(employees):
    out = []
    for e in random.sample(employees, min(12, len(employees))):
        out.append({
            "name": f"Payslip - {e['first_name']} {e['last_name']}",
            "employee_id": e.get("_id"),
            "employee_name": f"{e['first_name']} {e['last_name']}",
            "gross_pay": e.get("base_salary", 50000) / 12,
            "deductions": rand_amount(500, 3000),
            "net_pay": (e.get("base_salary", 50000) / 12) - rand_amount(500, 3000),
            "period_end": rand_date(30, 0),
            "status": random.choice(["Paid","Paid","Pending","Processed"]),
        })
    return out

def build_suppliers():
    out = []
    pool = ["Global Parts Inc","Pacific Materials","Atlas Equipment","Nordic Supplies",
            "Summit Components","Vertex Resources","Pinnacle Trading","Mercer Industrial"]
    for s in pool:
        out.append({
            "name": s,
            "type": random.choice(["Supplier","Manufacturer","Distributor"]),
            "email": f"sales@{s.lower().replace(' ','')}.com",
            "phone": rand_phone(),
            "country": random.choice(["USA","Germany","China","Japan","UK","UAE"]),
            "status": random.choice(["Active","Active","Active","Inactive"]),
            "rating": random.randint(3, 5),
        })
    return out

def build_work_orders(products):
    out = []
    for i in range(12):
        p = random.choice(products) if products else None
        out.append({
            "work_order_number": f"WO-{8000+i:04d}",
            "title": f"Production: {p['name'] if p else 'Unknown'}",
            "product_id": p.get("_id") if p else None,
            "quantity": random.randint(10, 1000),
            "start_date": rand_date(30, 0),
            "due_date": rand_date(0, 30),
            "status": random.choice(["Pending","In Progress","In Progress","Completed","Cancelled"]),
            "priority": random.choice(["Low","Medium","High"]),
        })
    return out

def build_knowledge_base():
    out = []
    titles = ["How to reset your password","Setting up two-factor authentication",
              "Troubleshooting common errors","API Rate Limits Explained","Billing FAQ",
              "Onboarding Guide","Integration Documentation","Mobile App Tips",
              "Security Best Practices","Account Recovery Process"]
    for t in titles:
        out.append({
            "title": t,
            "category": random.choice(["FAQ","How-to","Troubleshooting","Reference"]),
            "status": random.choice(["Published","Published","Draft","Archived"]),
            "views": random.randint(0, 5000),
        })
    return out

def build_experiments():
    out = []
    for i in range(10):
        out.append({
            "name": f"Experiment {i+1}: {random.choice(['Catalyst A','Material B','Process C','Algorithm D'])}",
            "title": f"Experiment {i+1}",
            "status": random.choice(["Planned","Running","Completed","Completed","Aborted"]),
            "start_date": rand_date(120, 0),
            "researcher": rand_name(),
            "hypothesis": "Documented research hypothesis with measurable outcomes.",
        })
    return out

def build_legal_cases():
    out = []
    titles = ["IP Dispute - Patent #12345","Contract Breach - Vendor X","Employment Claim - Anonymous",
              "Trademark Infringement","Regulatory Audit","Tax Notice Response","Data Breach Investigation"]
    for t in titles:
        out.append({
            "title": t,
            "case_type": random.choice(["Civil","Regulatory","Employment","Contract"]),
            "status": random.choice(["Open","In Litigation","Settled","Closed"]),
            "priority": random.choice(["Low","Medium","High","Critical"]),
            "filed_date": rand_date(300, 0),
            "estimated_value": rand_amount(5000, 500000),
        })
    return out

def build_compliance_policies():
    out = []
    for name in ["Data Privacy Policy","Information Security Policy","Code of Conduct",
                 "Anti-Bribery Policy","Whistleblower Policy","Acceptable Use Policy"]:
        out.append({
            "title": name,
            "status": random.choice(["Active","Active","Under Review","Draft"]),
            "version": f"{random.randint(1,3)}.{random.randint(0,9)}",
            "effective_date": rand_date(700, 0),
            "review_date": rand_date(0, 365),
        })
    return out

# ────────────────────────── accounting sub-entities ──────────────────────────
def build_invoice_payments(invoices):
    out = []
    for i in range(15):
        inv = random.choice(invoices)
        out.append({
            "payment_number": f"PMT-{9000+i:04d}",
            "invoice_id": inv.get("_id"),
            "invoice_number": inv.get("invoice_number"),
            "amount": rand_amount(100, inv.get("total", 5000)),
            "payment_date": rand_date(60, 0),
            "method": random.choice(["Bank Transfer","Credit Card","Check","Cash"]),
            "status": random.choice(["Pending","Cleared","Cleared","Cleared"]),
        })
    return out

def build_payment_reminders(invoices):
    out = []
    for i in range(8):
        inv = random.choice(invoices)
        out.append({
            "reminder_number": f"RMD-{1000+i:04d}",
            "invoice_id": inv.get("_id"),
            "invoice_number": inv.get("invoice_number"),
            "scheduled_date": rand_date(30, 30),
            "method": random.choice(["Email","SMS","Letter"]),
            "status": random.choice(["Scheduled","Sent","Sent","Cancelled"]),
        })
    return out

def build_bill_payments(bills):
    out = []
    for i in range(12):
        b = random.choice(bills)
        out.append({
            "payment_number": f"BPMT-{2000+i:04d}",
            "bill_id": b.get("_id"),
            "amount": b.get("amount", 1000),
            "payment_date": rand_date(60, 0),
            "method": random.choice(["Bank Transfer","Check","Wire"]),
            "status": random.choice(["Cleared","Cleared","Pending"]),
        })
    return out

def build_batch_payments():
    out = []
    for i in range(6):
        out.append({
            "batch_number": f"BAT-{3000+i:04d}",
            "batch_date": rand_date(60, 0),
            "total_amount": rand_amount(5000, 100000),
            "payment_count": random.randint(3, 30),
            "status": random.choice(["Pending","Processing","Completed","Completed"]),
        })
    return out

def build_po_receipts(purchase_orders):
    out = []
    for i in range(10):
        po = random.choice(purchase_orders) if purchase_orders else {}
        out.append({
            "receipt_number": f"RCP-{4000+i:04d}",
            "po_id": po.get("_id"),
            "po_number": po.get("po_number"),
            "received_date": rand_date(30, 0),
            "received_by": rand_name(),
            "status": random.choice(["Received","Partial","Received"]),
        })
    return out

def build_bank_statements(bank_accounts):
    out = []
    for i in range(10):
        ba = random.choice(bank_accounts) if bank_accounts else {}
        out.append({
            "statement_number": f"STMT-{5000+i:04d}",
            "bank_account_id": ba.get("_id"),
            "bank_account_name": ba.get("name"),
            "statement_date": rand_date(120, 0),
            "opening_balance": rand_amount(1000, 50000),
            "closing_balance": rand_amount(1000, 50000),
            "status": random.choice(["Imported","Reconciled","Reconciled"]),
        })
    return out

def build_bank_reconciliations(bank_accounts):
    out = []
    for i in range(6):
        ba = random.choice(bank_accounts) if bank_accounts else {}
        out.append({
            "name": f"Reconciliation - {ba.get('name','Account')} {i+1}",
            "bank_account_id": ba.get("_id"),
            "reconciliation_date": rand_date(60, 0),
            "status": random.choice(["In Progress","Completed","Completed"]),
            "difference": rand_amount(-500, 500),
        })
    return out

def build_bank_statement_transactions(bank_statements):
    out = []
    for i in range(20):
        bs = random.choice(bank_statements) if bank_statements else {}
        out.append({
            "transaction_date": rand_date(60, 0),
            "description": random.choice(["Deposit","Withdrawal","Wire Transfer","Check Payment","Card Charge"]),
            "amount": rand_amount(-5000, 10000),
            "statement_id": bs.get("_id"),
            "status": random.choice(["Unmatched","Matched","Cleared"]),
        })
    return out

def build_reconciliation_items(bank_reconciliations):
    out = []
    for i in range(12):
        br = random.choice(bank_reconciliations) if bank_reconciliations else {}
        out.append({
            "reconciliation_id": br.get("_id"),
            "description": random.choice(["Outstanding check","Deposit in transit","Bank fee","Interest earned"]),
            "amount": rand_amount(10, 2000),
            "status": random.choice(["Unmatched","Matched","Cleared"]),
        })
    return out

def build_budgets():
    out = []
    for i in range(8):
        out.append({
            "name": f"FY{2025+i%2} Budget - {random.choice(['Marketing','Operations','R&D','IT','Sales'])}",
            "fiscal_year": 2026,
            "total_amount": rand_amount(50000, 1000000),
            "period": random.choice(["Monthly","Quarterly","Yearly"]),
            "status": random.choice(["Draft","Approved","Active","Active"]),
        })
    return out

def build_budget_lines(budgets):
    out = []
    for i in range(15):
        b = random.choice(budgets) if budgets else {}
        out.append({
            "budget_id": b.get("_id"),
            "category": random.choice(["Salaries","Marketing","Travel","Software","Office","Equipment"]),
            "amount": rand_amount(1000, 50000),
            "actual_spent": rand_amount(0, 30000),
            "status": random.choice(["Planned","Committed","Spent","Overrun"]),
        })
    return out

def build_budget_revisions():
    out = []
    for i in range(5):
        out.append({
            "revision_number": f"REV-{i+1}",
            "reason": random.choice(["Cost overrun","Scope change","Approval increase","Reallocation"]),
            "amount_change": rand_amount(-50000, 100000),
            "status": random.choice(["Draft","Approved","Rejected"]),
        })
    return out

def build_budget_scenarios():
    out = []
    for name in ["Best Case","Worst Case","Most Likely","Conservative","Aggressive"]:
        out.append({
            "name": f"{name} Scenario",
            "fiscal_year": 2026,
            "total_revenue": rand_amount(500000, 5000000),
            "total_expenses": rand_amount(400000, 4000000),
            "status": random.choice(["Draft","Approved","Active"]),
        })
    return out

def build_budget_templates():
    out = []
    for name in ["Department Budget","Project Budget","Capital Expenditure","Operating Budget"]:
        out.append({
            "name": f"{name} Template",
            "category": random.choice(["Department","Project","Capital","Operating"]),
            "status": random.choice(["Active","Active","Draft"]),
        })
    return out

def build_budget_alerts(budgets):
    out = []
    for i in range(6):
        b = random.choice(budgets) if budgets else {}
        out.append({
            "budget_id": b.get("_id"),
            "alert_type": random.choice(["80% Used","100% Used","Overrun"]),
            "severity": random.choice(["Warning","Critical","Info"]),
            "status": random.choice(["Open","Acknowledged","Resolved"]),
        })
    return out

def build_payroll_journals(payroll_runs):
    out = []
    for i in range(8):
        pr = random.choice(payroll_runs) if payroll_runs else {}
        out.append({
            "journal_number": f"PJ-{6000+i:04d}",
            "payroll_run_id": pr.get("_id"),
            "total_amount": pr.get("total_amount", 100000),
            "posted_date": rand_date(60, 0),
            "status": random.choice(["Posted","Posted","Draft"]),
        })
    return out

def build_salary_structures():
    out = []
    for grade in ["Junior","Mid","Senior","Lead","Director","Executive"]:
        out.append({
            "name": f"{grade} Grade",
            "min_salary": rand_amount(30000, 200000),
            "max_salary": rand_amount(50000, 400000),
            "frequency": "Monthly",
            "status": "Active",
        })
    return out

def build_payroll_employees(employees):
    out = []
    for e in employees[:15]:
        out.append({
            "employee_id": e.get("_id"),
            "employee_name": f"{e['first_name']} {e['last_name']}",
            "base_salary": e.get("base_salary", 50000),
            "bank_account": f"****{random.randint(1000,9999)}",
            "tax_status": random.choice(["Single","Married","Head of Household"]),
            "status": "Active",
        })
    return out

def build_time_entries(employees, projects):
    out = []
    for i in range(20):
        e = random.choice(employees) if employees else {}
        p = random.choice(projects) if projects else {}
        out.append({
            "employee_id": e.get("_id"),
            "project_id": p.get("_id"),
            "entry_date": rand_date(30, 0),
            "hours": random.choice([4, 6, 7.5, 8, 8, 8, 8.5]),
            "description": random.choice(["Development","Meeting","Documentation","Review","Testing"]),
        })
    return out

def build_depreciation(assets):
    out = []
    for a in assets[:10]:
        out.append({
            "asset_id": a.get("_id"),
            "name": f"Depreciation - {a.get('name')}",
            "method": random.choice(["Straight Line","Declining Balance","Sum of Years"]),
            "annual_amount": rand_amount(500, 5000),
            "accumulated": rand_amount(1000, 20000),
            "status": "Active",
        })
    return out

def build_tax_rates():
    out = []
    for name, rate, t in [("Standard VAT", 17, "VAT"), ("Reduced VAT", 5, "VAT"),
                          ("Zero Rate", 0, "VAT"), ("Sales Tax", 8.5, "Sales"),
                          ("Withholding", 10, "Withholding"), ("GST", 5, "GST")]:
        out.append({
            "name": name,
            "rate": rate,
            "type": t,
            "effective_date": rand_date(700, 0),
            "status": "Active",
        })
    return out

def build_tax_configurations():
    out = []
    for c in ["United States","United Kingdom","Germany","UAE","Singapore"]:
        out.append({
            "name": f"{c} Tax Config",
            "country": c,
            "currency": random.choice(["USD","EUR","GBP","AED","SGD"]),
            "fiscal_year_start": "01-01",
            "status": "Active",
        })
    return out

def build_tax_payments():
    out = []
    for i in range(8):
        out.append({
            "payment_number": f"TAX-{7000+i:04d}",
            "tax_period": f"Q{random.randint(1,4)} 2026",
            "amount": rand_amount(5000, 100000),
            "due_date": rand_date(-30, 60),
            "status": random.choice(["Due","Paid","Paid","Overdue"]),
        })
    return out

def build_accounting_periods():
    out = []
    for month in range(1, 13):
        period_date = date(2026, month, 1)
        out.append({
            "name": period_date.strftime("%B %Y"),
            "start_date": period_date.isoformat(),
            "end_date": ((period_date.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)).isoformat(),
            "status": "Open" if month >= date.today().month else "Closed",
        })
    return out

def build_period_closings():
    out = []
    for month in range(1, 8):
        out.append({
            "name": f"Closing - {date(2026,month,1).strftime('%b %Y')}",
            "period": date(2026,month,1).strftime("%B %Y"),
            "closed_date": rand_date(180, 0),
            "closed_by": rand_name(),
            "status": "Completed",
        })
    return out

def build_period_adjustments():
    out = []
    for i in range(8):
        out.append({
            "adjustment_number": f"ADJ-{8000+i:04d}",
            "date": rand_date(180, 0),
            "amount": rand_amount(-5000, 5000),
            "reason": random.choice(["Accrual","Reversal","Reclassification","Correction"]),
            "status": random.choice(["Draft","Posted","Posted"]),
        })
    return out

def build_year_end_closings():
    out = []
    for year in [2024, 2025]:
        out.append({
            "name": f"Year-End {year} Closing",
            "fiscal_year": year,
            "closed_date": date(year+1, 1, 31).isoformat(),
            "net_income": rand_amount(50000, 1000000),
            "status": "Completed",
        })
    return out

def build_currencies():
    out = []
    for code, name in [("USD","US Dollar"),("EUR","Euro"),("GBP","British Pound"),
                        ("PKR","Pakistani Rupee"),("AED","UAE Dirham"),("JPY","Japanese Yen"),
                        ("CAD","Canadian Dollar"),("SGD","Singapore Dollar")]:
        out.append({
            "code": code,
            "name": name,
            "symbol": code,
            "is_base": code == "USD",
            "status": "Active",
        })
    return out

def build_exchange_rates():
    out = []
    for code in ["EUR","GBP","PKR","AED","JPY","CAD","SGD"]:
        out.append({
            "from_currency": "USD",
            "to_currency": code,
            "rate": rand_amount(0.5, 280),
            "effective_date": rand_date(30, 0),
            "status": "Active",
        })
    return out

def build_fx_transactions():
    out = []
    for i in range(10):
        out.append({
            "transaction_number": f"FX-{9000+i:04d}",
            "from_currency": random.choice(["USD","EUR","GBP"]),
            "to_currency": random.choice(["EUR","GBP","PKR","JPY"]),
            "amount": rand_amount(1000, 100000),
            "rate": rand_amount(0.5, 5),
            "date": rand_date(60, 0),
            "type": random.choice(["Buy","Sell"]),
            "status": random.choice(["Completed","Completed","Pending"]),
        })
    return out

def build_unrealized_gain_loss():
    out = []
    for i in range(6):
        out.append({
            "currency": random.choice(["EUR","GBP","PKR"]),
            "exposure": rand_amount(10000, 500000),
            "current_value": rand_amount(9000, 510000),
            "type": random.choice(["Gain","Loss"]),
            "as_of_date": rand_date(7, 0),
        })
    return out

def build_job_postings():
    out = []
    for title in ["Senior Software Engineer","Product Manager","UX Designer","HR Manager",
                  "Sales Director","Financial Analyst","DevOps Engineer","Customer Success"]:
        out.append({
            "title": title,
            "department": random.choice(DEPARTMENTS),
            "location": random.choice(CITIES),
            "employment_type": random.choice(["Full-time","Full-time","Contract"]),
            "status": random.choice(["Open","Open","Filled","On Hold"]),
            "posted_date": rand_date(60, 0),
        })
    return out

def build_interviews(applications):
    out = []
    for a in applications[:10]:
        out.append({
            "candidate_name": a.get("name"),
            "applicant_id": a.get("_id"),
            "scheduled_at": rand_date(0, 30),
            "round": random.choice(["Phone Screen","Technical","Onsite","Final"]),
            "interviewer": rand_name(),
            "status": random.choice(["Scheduled","Completed","Completed","No Show"]),
        })
    return out

def build_leave_balances(employees):
    out = []
    for e in employees[:15]:
        out.append({
            "employee_id": e.get("_id"),
            "employee_name": f"{e['first_name']} {e['last_name']}",
            "leave_type": random.choice(["Annual","Sick","Personal"]),
            "balance_days": random.randint(0, 25),
            "used_days": random.randint(0, 15),
            "year": 2026,
        })
    return out

def build_performance_reviews(employees):
    out = []
    for e in random.sample(employees, min(10, len(employees))):
        out.append({
            "employee_id": e.get("_id"),
            "employee_name": f"{e['first_name']} {e['last_name']}",
            "review_period": "H1 2026",
            "overall_rating": random.randint(3, 5),
            "reviewer": rand_name(),
            "is_finalized": random.random() > 0.4,
            "status": random.choice(["Draft","Submitted","Approved","Approved"]),
        })
    return out

def build_stock_movements(stock_items, warehouses):
    out = []
    for i in range(20):
        s = random.choice(stock_items) if stock_items else {}
        w = random.choice(warehouses) if warehouses else {}
        out.append({
            "movement_number": f"MOV-{1000+i:04d}",
            "stock_item_id": s.get("_id"),
            "warehouse_id": w.get("_id"),
            "quantity": random.randint(1, 100),
            "movement_type": random.choice(["In","Out","Transfer","Adjustment"]),
            "date": rand_date(60, 0),
            "reason": random.choice(["Purchase","Sale","Return","Adjustment"]),
        })
    return out

def build_purchase_requisitions(employees):
    out = []
    for i in range(8):
        e = random.choice(employees) if employees else {}
        out.append({
            "requisition_number": f"PR-{1000+i:04d}",
            "requested_by": f"{e.get('first_name','')} {e.get('last_name','')}".strip(),
            "department": random.choice(DEPARTMENTS),
            "amount": rand_amount(200, 25000),
            "requested_date": rand_date(30, 0),
            "status": random.choice(["Draft","Submitted","Approved","Approved","Rejected"]),
            "priority": random.choice(["Low","Medium","High"]),
        })
    return out

def build_rfqs(suppliers):
    out = []
    for i in range(6):
        out.append({
            "rfq_number": f"RFQ-{2000+i:04d}",
            "title": f"RFQ for {random.choice(['Office Supplies','IT Equipment','Vehicle','Service','Materials'])}",
            "issue_date": rand_date(60, 0),
            "deadline": rand_date(0, 30),
            "supplier_count": random.randint(2, 8),
            "status": random.choice(["Open","Closed","Awarded"]),
        })
    return out

def build_supplier_contracts(suppliers):
    out = []
    for i, s in enumerate(suppliers[:8]):
        start = date.today() - timedelta(days=random.randint(0, 365))
        out.append({
            "contract_number": f"SC-{3000+i:04d}",
            "supplier_name": s.get("name") if isinstance(s, dict) else "Supplier",
            "supplier_id": s.get("_id") if isinstance(s, dict) else None,
            "start_date": start.isoformat(),
            "end_date": (start + timedelta(days=365)).isoformat(),
            "value": rand_amount(10000, 500000),
            "status": random.choice(["Active","Active","Expired"]),
        })
    return out

def build_service_requests(customers):
    out = []
    for i in range(10):
        c = random.choice(customers) if customers else {}
        out.append({
            "request_number": f"SR-{4000+i:04d}",
            "subject": random.choice(["Installation","Maintenance","Repair","Training","Consultation"]),
            "customer_name": c.get("name"),
            "requested_date": rand_date(30, 0),
            "priority": random.choice(["Low","Medium","High","Urgent"]),
            "status": random.choice(["New","Assigned","In Progress","Completed"]),
        })
    return out

def build_customer_feedback(customers):
    out = []
    for i in range(10):
        c = random.choice(customers) if customers else {}
        out.append({
            "customer_name": c.get("name"),
            "subject": random.choice(["Great service!","Could be better","Excellent support","Issue resolved"]),
            "rating": random.randint(2, 5),
            "sentiment": random.choice(["Positive","Positive","Neutral","Negative"]),
            "received_date": rand_date(60, 0),
            "status": random.choice(["New","Reviewed","Actioned"]),
        })
    return out

def build_sla_agreements(customers):
    out = []
    for i in range(6):
        c = random.choice(customers) if customers else {}
        out.append({
            "name": f"SLA - {c.get('name','Customer')}",
            "customer_id": c.get("_id"),
            "response_time_hours": random.choice([4, 8, 24, 48]),
            "uptime_percentage": random.choice([99.9, 99.5, 99.0]),
            "status": "Active",
            "valid_until": rand_date(0, 365),
        })
    return out

# ────────────────────────── main ──────────────────────────
def main():
    random.seed(42)
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()

    total_inserted = 0
    skipped = []

    def run(entity_type, builder, module_code=None):
        nonlocal total_inserted
        recs = builder
        inserted, existing = insert(cur, entity_type, recs, module_code)
        total_inserted += inserted
        if inserted == 0:
            skipped.append(f"{entity_type} ({existing} existing)")
        else:
            print(f"  ✓ {entity_type:30s} {inserted} rows")
        return recs

    print("Seeding dummy data…\n")

    # Build foundational entities first so others can reference them.
    customers = run('customers', build_customers(), 'sales')
    vendors   = run('vendors',   build_vendors(),   'accounting')
    accounts  = run('accounts',  build_accounts(),  'accounting')
    employees = run('employees', build_employees(), 'hr')
    projects  = run('projects',  build_projects(),  'pm')

    # Now the entities that reference them.
    run('invoices',        build_invoices(customers),    'accounting')
    run('bills',           build_bills(vendors),         'accounting')
    run('transactions',    build_transactions(accounts), 'accounting')
    run('purchase_orders', build_purchase_orders(vendors),'scm')

    run('leave_requests',  build_leave_requests(employees), 'hr')
    run('attendance',      build_attendance(employees),     'hr')
    run('applications',    build_applications(),            'hr')

    run('leads',           build_leads(),                'marketing')
    run('opportunities',   build_opportunities(customers),'sales')
    run('contacts',        build_contacts(customers),    'contacts')
    run('campaigns',       build_campaigns(),            'marketing')
    run('contents',        build_content(),              'marketing')

    run('tasks',           build_tasks(projects),        'pm')
    run('milestones',      build_milestones(projects),   'pm')

    run('service_tickets', build_service_tickets(),      'customer-service')

    run('stock_items',     build_stock_items(),          'inventory')
    run('warehouses',      build_warehouses(),           'inventory')
    run('products',        build_products(),             'production')

    run('risks',                build_risks(),                'administration')
    run('licenses',             build_licenses(),             'administration')
    run('board_meetings',       build_board_meetings(),       'administration')
    run('insurance_policies',   build_insurance_policies(),   'administration')
    run('contracts',            build_contracts(customers),   'administration')
    run('credentials',          build_credentials(),          'administration')
    run('documents',            build_documents(),            'administration')
    run('subscriptions',        build_subscriptions(),        'accounting')
    run('assets',               build_assets(),               'administration')

    # ── Second wave: entities pages reference but the first wave skipped ──
    run('sales_accounts', build_sales_accounts(customers), 'contacts')
    invoices_rec  = []  # already inserted in first wave; fetch the prior list for FK seeding
    bills_rec     = []
    pos_rec       = []

    # Refetch previously-inserted lists (with their actual UUIDs) so the
    # second-wave FK builders can reference them.
    def fetch_seeded(entity_type):
        cur.execute(
            "SELECT id, data FROM entity_records WHERE entity_type=%s AND is_deleted='N' LIMIT 50",
            (entity_type,),
        )
        return [{"_id": str(r[0]), **(r[1] or {})} for r in cur.fetchall()]

    invoices_rec        = fetch_seeded('invoices')
    bills_rec           = fetch_seeded('bills')
    pos_rec             = fetch_seeded('purchase_orders')

    run('quotes',               build_quotes(customers),       'sales')
    run('orders',               build_orders(customers),       'sales')

    bank_accounts = run('bank_accounts', build_bank_accounts(), 'accounting')
    bank_accounts = fetch_seeded('bank_accounts')

    run('payroll_runs',         build_payroll_runs(employees), 'accounting')
    payroll_runs = fetch_seeded('payroll_runs')
    run('payslips',             build_payslips(employees),     'accounting')

    suppliers = run('suppliers', build_suppliers(),            'scm')
    suppliers = fetch_seeded('suppliers')

    products_recs = run('products', build_products(),          'production')
    products_recs = fetch_seeded('products')
    run('work_orders',          build_work_orders(products_recs), 'production')

    run('knowledge_base',       build_knowledge_base(),        'customer-service')
    run('experiments',          build_experiments(),           'rd')
    run('legal_cases',          build_legal_cases(),           'administration')
    run('compliance_policies',  build_compliance_policies(),   'administration')

    # ── Third wave: deep accounting + ops gaps ──
    run('invoice_payments',     build_invoice_payments(invoices_rec),    'accounting')
    run('payment_reminders',    build_payment_reminders(invoices_rec),   'accounting')
    run('bill_payments',        build_bill_payments(bills_rec),          'accounting')
    run('batch_payments',       build_batch_payments(),                  'accounting')
    run('po_receipts',          build_po_receipts(pos_rec),              'accounting')
    bank_statements = run('bank_statements', build_bank_statements(bank_accounts), 'accounting')
    bank_statements = fetch_seeded('bank_statements')
    bank_recs = run('bank_reconciliations', build_bank_reconciliations(bank_accounts), 'accounting')
    bank_recs = fetch_seeded('bank_reconciliations')
    run('bank_statement_transactions', build_bank_statement_transactions(bank_statements), 'accounting')
    run('reconciliation_items', build_reconciliation_items(bank_recs),   'accounting')

    budgets_rec = run('budgets', build_budgets(), 'accounting')
    budgets_rec = fetch_seeded('budgets')
    run('budget_lines',         build_budget_lines(budgets_rec),         'accounting')
    run('budget_revisions',     build_budget_revisions(),                'accounting')
    run('budget_scenarios',     build_budget_scenarios(),                'accounting')
    run('budget_templates',     build_budget_templates(),                'accounting')
    run('budget_alerts',        build_budget_alerts(budgets_rec),        'accounting')

    payroll_runs = fetch_seeded('payroll_runs')
    run('payroll_journals',     build_payroll_journals(payroll_runs),    'accounting')
    run('salary_structures',    build_salary_structures(),               'accounting')
    run('payroll_employees',    build_payroll_employees(employees),      'accounting')
    run('time_entries',         build_time_entries(employees, projects), 'accounting')

    assets_rec = fetch_seeded('assets')
    run('depreciation',         build_depreciation(assets_rec),          'accounting')

    run('tax_rates',            build_tax_rates(),                       'accounting')
    run('tax_configurations',   build_tax_configurations(),              'accounting')
    run('tax_payments',         build_tax_payments(),                    'accounting')
    run('accounting_periods',   build_accounting_periods(),              'accounting')
    run('period_closings',      build_period_closings(),                 'accounting')
    run('period_adjustments',   build_period_adjustments(),              'accounting')
    run('year_end_closings',    build_year_end_closings(),               'accounting')
    run('currencies',           build_currencies(),                      'accounting')
    run('exchange_rates',       build_exchange_rates(),                  'accounting')
    run('currency_exchange_transactions', build_fx_transactions(),       'accounting')
    run('unrealized_gain_loss', build_unrealized_gain_loss(),            'accounting')

    # ── HR gaps ──
    run('job_postings',         build_job_postings(),                    'hr')
    apps_rec = fetch_seeded('applications')
    run('interviews',           build_interviews(apps_rec),              'hr')
    run('leave_balances',       build_leave_balances(employees),         'hr')
    run('performance_reviews',  build_performance_reviews(employees),    'hr')

    # ── Inventory + SCM + Customer Service gaps ──
    stock_recs = fetch_seeded('stock_items')
    warehouse_recs = fetch_seeded('warehouses')
    run('stock_movements',      build_stock_movements(stock_recs, warehouse_recs), 'inventory')
    run('purchase_requisitions',build_purchase_requisitions(employees),  'scm')
    run('rfqs',                 build_rfqs(suppliers),                   'scm')
    run('supplier_contracts',   build_supplier_contracts(suppliers),     'scm')
    run('service_requests',     build_service_requests(customers),       'customer-service')
    run('customer_feedback',    build_customer_feedback(customers),      'customer-service')
    run('sla_agreements',       build_sla_agreements(customers),         'customer-service')

    # ── Fourth wave: page-name aliases + remaining gaps ──
    # Mirrors of existing data under the entity_type names the pages actually use.
    def mirror(src_type, dst_type, module_code=None):
        cur.execute(
            "SELECT data FROM entity_records WHERE entity_type=%s AND is_deleted='N'",
            (src_type,),
        )
        rows = [r[0] for r in cur.fetchall()]
        # Strip any embedded _id from source records.
        rows = [{k: v for k, v in r.items() if k != '_id'} for r in rows]
        if rows:
            run(dst_type, rows, module_code)

    mirror('applications',   'applicants',         'hr')
    mirror('leave_requests', 'leaves',             'hr')
    mirror('leave_requests', 'time_off',           'hr')
    mirror('service_tickets','support_tickets',    'customer-service')
    mirror('accounting_periods', 'periods',        'accounting')
    mirror('accounts',       'chart_of_accounts',  'accounting')
    mirror('rfqs',           'rfq',                'scm')
    mirror('assets',         'fixed_assets',       'accounting')
    mirror('projects',       'pm_projects',        'pm')
    mirror('tasks',          'pm_tasks',           'pm')
    mirror('milestones',     'pm_milestones',      'pm')
    mirror('experiments',    'rd_projects',        'rd')
    mirror('payroll_runs',   'hr_payroll_runs',    'hr')
    mirror('payslips',       'hr_payslips',        'hr')

    # Generic builder for the remaining types — minimum viable rows.
    def generic(entity_type, n, kind='generic'):
        out = []
        for i in range(n):
            base = {
                "name": f"{entity_type.replace('_',' ').title()} #{i+1}",
                "title": f"{entity_type.replace('_',' ').title()} #{i+1}",
                "status": random.choice(["Active","Active","Pending","Completed"]),
                "created_date": rand_date(120, 0),
            }
            if kind == 'financial':
                base["amount"] = rand_amount(100, 25000)
            elif kind == 'people':
                base["full_name"] = rand_name()
                base["email"] = rand_email()
            out.append(base)
        return out

    run('bonuses',              generic('bonuses', 8, 'financial'),       'hr')
    run('commissions',          generic('commissions', 8, 'financial'),   'hr')
    run('benefits_plans',       generic('benefits_plans', 6),             'hr')
    run('employee_benefits',    generic('employee_benefits', 10),         'hr')
    run('employee_credentials', generic('employee_credentials', 8),       'hr')
    run('background_checks',    generic('background_checks', 6),          'hr')
    run('assessments',          generic('assessments', 8),                'hr')
    run('positions',            generic('positions', 8),                  'hr')
    run('departments',          generic('departments', 6),                'hr')
    run('pay_grades',           generic('pay_grades', 6),                 'hr')
    run('salary_adjustments',   generic('salary_adjustments', 6, 'financial'), 'hr')
    run('salary_bands',         generic('salary_bands', 5),               'hr')
    run('job_offers',           generic('job_offers', 6),                 'hr')
    run('job_requisitions',     generic('job_requisitions', 6),           'hr')
    run('compensation',         generic('compensation', 8, 'financial'),  'hr')
    run('performance',          generic('performance', 8),                'hr')
    run('recruitment',          generic('recruitment', 6),                'hr')
    run('training',             generic('training', 8),                   'hr')
    run('learning',             generic('learning', 8),                   'hr')

    run('strategic_initiatives',generic('strategic_initiatives', 6),      'pm')
    run('resources',            generic('resources', 8),                  'pm')
    run('time_tracking',        generic('time_tracking', 10, 'financial'),'pm')
    run('pm_budgets',           generic('pm_budgets', 6, 'financial'),    'pm')
    run('pm_resources',         generic('pm_resources', 8),               'pm')

    run('prototypes',           generic('prototypes', 6),                 'rd')
    run('patents',              generic('patents', 6),                    'rd')
    run('research_papers',      generic('research_papers', 8),            'rd')
    run('research_team_members',generic('research_team_members', 8, 'people'), 'rd')
    run('rd_milestones',        generic('rd_milestones', 6),              'rd')
    run('rd_budgets',           generic('rd_budgets', 5, 'financial'),    'rd')
    run('rd_collaborations',    generic('rd_collaborations', 5),          'rd')
    run('lab_equipment',        generic('lab_equipment', 8),              'rd')

    run('campaign_activities',     generic('campaign_activities', 8),      'marketing')
    run('campaign_metrics',        generic('campaign_metrics', 10),        'marketing')
    run('marketing_email_templates', generic('marketing_email_templates', 8), 'marketing')
    run('lead_activities',         generic('lead_activities', 10),         'marketing')
    run('website_analytics',       generic('website_analytics', 8),        'marketing')
    run('segments',                generic('segments', 6),                 'marketing')
    run('lists',                   generic('lists', 6),                    'marketing')

    run('stock_adjustments',    generic('stock_adjustments', 8),          'inventory')
    run('stock_transfers',      generic('stock_transfers', 6),            'inventory')
    run('inventory',            generic('inventory', 10),                 'inventory')

    run('production_lines',     generic('production_lines', 5),           'production')
    run('production_products',  generic('production_products', 8),        'production')
    run('bill_of_materials',    generic('bill_of_materials', 6),          'production')

    run('pos_sessions',         generic('pos_sessions', 8),               'ecommerce')
    run('storefronts',          generic('storefronts', 4),                'ecommerce')

    run('compliance_audits',    generic('compliance_audits', 6),          'administration')
    run('cases',                generic('cases', 6),                      'administration')

    run('activities',           generic('activities', 12),                'sales')
    run('payment_methods',      generic('payment_methods', 6),            'accounting')
    run('tax_settings',         generic('tax_settings', 4),               'accounting')
    run('reports',              generic('reports', 8),                    'hr')
    run('messages',             generic('messages', 5),                   None)

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✓ Done. Inserted {total_inserted} rows.")
    if skipped:
        print(f"  Skipped (already had ≥3 records): {len(skipped)} entities")
        for s in skipped[:5]:
            print(f"    - {s}")
        if len(skipped) > 5:
            print(f"    … and {len(skipped) - 5} more")


if __name__ == "__main__":
    main()
