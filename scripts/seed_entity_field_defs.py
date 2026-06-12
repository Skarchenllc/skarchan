#!/usr/bin/env python3
"""
Registers proper `custom_field_definitions` rows for every major entity
so previews/forms show the full record (not just status + priority).

Idempotent — for each (entity_type, field_name):
  • inserts when missing
  • upgrades only `field_group` and `display_order` on existing rows
    (leaves user-customised labels, types, picklist values intact)

Run from repo root:  python3 scripts/seed_entity_field_defs.py
"""
import os
import json
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
SYS = "00000000-0000-0000-0000-000000000001"


def F(name, label, ftype, group, order, picklist=None):
    return (name, label, ftype, picklist, group, order)


# Standard re-usable field tuples
def IDENT(off=0):
    return [
        F("name",        "Name",        "text",     "Identity", 10 + off),
        F("description", "Description", "textarea", "Identity", 11 + off),
    ]

def NOTES():
    return [F("notes", "Notes", "textarea", "Notes", 90)]


SCHEMAS = {
    # ─── PM ──────────────────────────────────────────────
    "tasks": [
        F("name",        "Name",        "text",     "Identity",  10),
        F("title",       "Title",       "text",     "Identity",  11),
        F("description", "Description", "textarea", "Identity",  12),
        F("project_id",  "Project",     "entity_reference", "Identity", 13),
        F("project_name","Project Name","text",     "Identity",  14),
        F("status",      "Status",      "picklist", "Status",    20),
        F("priority",    "Priority",    "picklist", "Status",    21),
        F("assignee",    "Assignee",    "text",     "Assignment",30),
        F("due_date",    "Due Date",    "date",     "Timeline",  40),
        F("start_date",  "Start Date",  "date",     "Timeline",  41),
        F("notes",       "Notes",       "textarea", "Notes",     90),
    ],
    "milestones": [
        F("name",        "Name",        "text",     "Identity",  10),
        F("title",       "Title",       "text",     "Identity",  11),
        F("project_id",  "Project",     "entity_reference", "Identity", 12),
        F("status",      "Status",      "picklist", "Status",    20),
        F("due_date",    "Due Date",    "date",     "Timeline",  30),
        F("notes",       "Notes",       "textarea", "Notes",     90),
    ],

    # ─── CRM / Sales ─────────────────────────────────────
    "leads": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("email",         "Email",         "email",    "Contact",  20),
        F("phone",         "Phone",         "phone",    "Contact",  21),
        F("company_name",  "Company",       "text",     "Identity", 12),
        F("status",        "Status",        "picklist", "Status",   30),
        F("source",        "Source",        "picklist", "Status",   31),
        F("campaign",      "Campaign",      "text",     "Source",   32),
        F("score",         "Lead Score",    "number",   "Scoring",  35),
        F("grade",         "Grade",         "picklist", "Scoring",  36),
        F("estimated_value","Estimated Value","currency","Financial",40),
        F("notes",         "Notes",         "textarea", "Notes",    90),
    ],
    "opportunities": [
        F("name",         "Name",         "text",     "Identity",  10),
        F("subject",      "Subject",      "text",     "Identity",  11),
        F("account_name", "Account",      "text",     "Identity",  12),
        F("account_id",   "Account Ref",  "entity_reference", "Identity", 13),
        F("amount",       "Amount",       "currency", "Financial", 20),
        F("probability",  "Probability %","number",   "Financial", 21),
        F("campaign",     "Campaign",     "text",     "Source",    22),
        F("stage",        "Stage",        "picklist", "Status",    30),
        F("priority",     "Priority",     "picklist", "Status",    31),
        F("win_reason",   "Win Reason",   "picklist", "Outcome",   35),
        F("loss_reason",  "Loss Reason",  "picklist", "Outcome",   36),
        F("close_date",   "Close Date",   "date",     "Timeline",  40),
        F("notes",        "Notes",        "textarea", "Notes",     90),
    ],
    "contacts": [
        F("first_name",   "First Name",   "text",     "Identity",  10),
        F("last_name",    "Last Name",    "text",     "Identity",  11),
        F("email",        "Email",        "email",    "Contact",   20),
        F("phone",        "Phone",        "phone",    "Contact",   21),
        F("company_name", "Company",      "text",     "Identity",  12),
        F("title",        "Title",        "text",     "Identity",  13),
        F("status",       "Status",       "picklist", "Status",    30),
        F("notes",        "Notes",        "textarea", "Notes",     90),
    ],
    "sales_accounts": [
        F("name",           "Name",           "text",     "Identity", 10),
        F("account_name",   "Account Name",   "text",     "Identity", 11),
        F("industry",       "Industry",       "text",     "Identity", 12),
        F("type",           "Type",           "picklist", "Status",   20),
        F("status",         "Status",         "picklist", "Status",   21),
        F("annual_revenue", "Annual Revenue", "currency", "Financial",30),
        F("phone",          "Phone",          "phone",    "Contact",  40),
        F("email",          "Email",          "email",    "Contact",  41),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "customers": [
        F("name",           "Name",           "text",     "Identity", 10),
        F("type",           "Type",           "picklist", "Identity", 11),
        F("status",         "Status",         "picklist", "Status",   20),
        F("email",          "Email",          "email",    "Contact",  30),
        F("phone",          "Phone",          "phone",    "Contact",  31),
        F("address",        "Address",        "textarea", "Contact",  32),
        F("annual_revenue", "Annual Revenue", "currency", "Financial",40),
        F("lifetime_value", "Lifetime Value", "currency", "Financial",41),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "quotes": [
        F("quote_number",   "Quote #",        "text",     "Identity", 10),
        F("customer_name",  "Customer",       "text",     "Identity", 11),
        F("customer_id",    "Customer Ref",   "entity_reference", "Identity", 12),
        F("status",         "Status",         "picklist", "Status",   20),
        F("item_count",     "Items",          "number",   "Line Items", 25),
        F("line_items",     "Line Items",     "textarea", "Line Items", 26),
        F("amount",         "Subtotal",       "currency", "Financial",30),
        F("discount_amount","Discount",       "currency", "Financial",31),
        F("tax",            "Tax",            "currency", "Financial",32),
        F("total_amount",   "Total",          "currency", "Financial",33),
        F("issue_date",     "Issue Date",     "date",     "Timeline", 40),
        F("valid_until",    "Valid Until",    "date",     "Timeline", 41),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "orders": [
        F("order_number",   "Order #",        "text",     "Identity", 10),
        F("customer_name",  "Customer",       "text",     "Identity", 11),
        F("customer_id",    "Customer Ref",   "entity_reference", "Identity", 12),
        F("status",         "Status",         "picklist", "Status",   20),
        F("payment_status", "Payment Status", "picklist", "Status",   21),
        F("item_count",     "Items",          "number",   "Line Items", 25),
        F("line_items",     "Line Items",     "textarea", "Line Items", 26),
        F("amount",         "Subtotal",       "currency", "Financial",30),
        F("discount_amount","Discount",       "currency", "Financial",31),
        F("tax",            "Tax",            "currency", "Financial",32),
        F("total_amount",   "Total",          "currency", "Financial",33),
        F("order_date",     "Order Date",     "date",     "Timeline", 40),
        F("delivery_date",  "Delivery Date",  "date",     "Timeline", 41),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "sales_products": [
        F("name",         "Name",         "text",     "Identity", 10),
        F("sku",          "SKU",          "text",     "Identity", 11),
        F("category",     "Category",     "picklist", "Classification", 20),
        F("description",  "Description",  "textarea", "Identity", 12),
        F("unit",         "Unit",         "picklist", "Pricing",  30),
        F("unit_price",   "Unit Price",   "currency", "Pricing",  31),
        F("cost",         "Cost",         "currency", "Pricing",  32),
        F("tax_rate",     "Tax Rate %",   "number",   "Pricing",  33),
        F("status",       "Status",       "picklist", "Status",   40),
    ],
    "activities": [
        F("subject",        "Subject",        "text",     "Identity", 10),
        F("type",           "Type",           "picklist", "Identity", 11),
        F("status",         "Status",         "picklist", "Status",   20),
        F("priority",       "Priority",       "picklist", "Status",   21),
        F("related_to",     "Related To",     "text",     "Identity", 12),
        F("assigned_to",    "Assigned To",    "text",     "Assignment",30),
        F("due_date",       "Due Date",       "date",     "Timeline", 40),
        F("completed_date", "Completed Date", "date",     "Timeline", 41),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "vendors": [
        F("name",           "Name",           "text",     "Identity", 10),
        F("type",           "Type",           "picklist", "Identity", 11),
        F("status",         "Status",         "picklist", "Status",   20),
        F("email",          "Email",          "email",    "Contact",  30),
        F("phone",          "Phone",          "phone",    "Contact",  31),
        F("payment_terms",  "Payment Terms",  "text",     "Financial",40),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],

    # ─── Accounting ─────────────────────────────────────
    "invoices": [
        F("invoice_number", "Invoice #",      "text",     "Identity", 10),
        F("customer_name",  "Customer",       "text",     "Identity", 11),
        F("customer_id",    "Customer Ref",   "entity_reference", "Identity", 12),
        F("amount",         "Amount",         "currency", "Financial",20),
        F("tax",            "Tax",            "currency", "Financial",21),
        F("total",          "Total",          "currency", "Financial",22),
        F("issue_date",     "Issue Date",     "date",     "Timeline", 30),
        F("due_date",       "Due Date",       "date",     "Timeline", 31),
        F("status",         "Status",         "picklist", "Status",   40),
        F("notes",          "Notes",          "textarea", "Notes",    90),
    ],
    "bills": [
        F("bill_number",  "Bill #",     "text",     "Identity", 10),
        F("vendor_name",  "Vendor",     "text",     "Identity", 11),
        F("vendor_id",    "Vendor Ref", "entity_reference", "Identity", 12),
        F("amount",       "Amount",     "currency", "Financial",20),
        F("issue_date",   "Issue Date", "date",     "Timeline", 30),
        F("due_date",     "Due Date",   "date",     "Timeline", 31),
        F("status",       "Status",     "picklist", "Status",   40),
        F("notes",        "Notes",      "textarea", "Notes",    90),
    ],
    "transactions": [
        F("transaction_number","Transaction #",  "text",     "Identity", 10),
        F("date",             "Date",            "date",     "Timeline", 20),
        F("transaction_date", "Transaction Date","date",     "Timeline", 21),
        F("reference",        "Reference",       "text",     "Identity", 12),
        F("amount",           "Amount",          "currency", "Financial",30),
        F("type",             "Type",            "picklist", "Classification",40),
        F("account_type",     "Account Type",    "picklist", "Classification",41),
        F("status",           "Status",          "picklist", "Status",   50),
        F("debit_account_id", "Debit Account",   "entity_reference", "Posting", 60),
        F("credit_account_id","Credit Account",  "entity_reference", "Posting", 61),
    ],
    "accounts": [
        F("name",         "Name",         "text",     "Identity", 10),
        F("code",         "Code",         "text",     "Identity", 11),
        F("account_type", "Account Type", "picklist", "Classification", 20),
        F("status",       "Status",       "picklist", "Status",   30),
        F("balance",      "Balance",      "currency", "Financial",40),
    ],
    "bank_accounts": [
        F("name",           "Name",           "text",     "Identity", 10),
        F("bank_name",      "Bank Name",      "text",     "Identity", 11),
        F("account_number", "Account Number", "text",     "Identity", 12),
        F("account_type",   "Account Type",   "picklist", "Classification", 20),
        F("balance",        "Balance",        "currency", "Financial",30),
        F("status",         "Status",         "picklist", "Status",   40),
    ],

    # ─── Customer Service ───────────────────────────────
    "service_tickets": [
        F("ticket_number","Ticket #",      "text",     "Identity", 10),
        F("subject",      "Subject",       "text",     "Identity", 11),
        F("title",        "Title",         "text",     "Identity", 12),
        F("customer_name","Customer",      "text",     "Identity", 13),
        F("category",     "Category",      "text",     "Classification", 20),
        F("status",       "Status",        "picklist", "Status",   30),
        F("priority",     "Priority",      "picklist", "Status",   31),
        F("created_date", "Created Date",  "date",     "Timeline", 40),
        F("notes",        "Notes",         "textarea", "Notes",    90),
    ],

    # ─── Inventory / Production / SCM ───────────────────
    "stock_items": [
        F("name",     "Name",     "text",     "Identity", 10),
        F("sku",      "SKU",      "text",     "Identity", 11),
        F("category", "Category", "text",     "Classification", 20),
        F("quantity", "Quantity", "number",   "Stock",    30),
        F("price",    "Price",    "currency", "Financial",40),
        F("cost",     "Cost",     "currency", "Financial",41),
        F("status",   "Status",   "picklist", "Status",   50),
    ],
    "products": [
        F("name",      "Name",      "text",     "Identity", 10),
        F("sku",       "SKU",       "text",     "Identity", 11),
        F("category",  "Category",  "picklist", "Classification", 20),
        F("price",     "Price",     "currency", "Financial",30),
        F("stock",     "Stock",     "number",   "Stock",    40),
        F("is_active", "Active",    "boolean",  "Status",   50),
    ],
    "warehouses": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("code",          "Code",          "text",     "Identity", 11),
        F("address",       "Address",       "textarea", "Identity", 12),
        F("capacity_units","Capacity Units","number",   "Capacity", 20),
        F("status",        "Status",        "picklist", "Status",   30),
    ],
    "suppliers": [
        F("name",    "Name",    "text",     "Identity", 10),
        F("type",    "Type",    "picklist", "Classification", 20),
        F("email",   "Email",   "email",    "Contact",  30),
        F("phone",   "Phone",   "phone",    "Contact",  31),
        F("country", "Country", "text",     "Contact",  32),
        F("status",  "Status",  "picklist", "Status",   40),
        F("rating",  "Rating",  "number",   "Status",   41),
    ],
    "purchase_orders": [
        F("po_number",     "PO #",          "text",     "Identity", 10),
        F("vendor_name",   "Vendor",        "text",     "Identity", 11),
        F("vendor_id",     "Vendor Ref",    "entity_reference", "Identity", 12),
        F("order_date",    "Order Date",    "date",     "Timeline", 20),
        F("expected_date", "Expected Date", "date",     "Timeline", 21),
        F("amount",        "Amount",        "currency", "Financial",30),
        F("status",        "Status",        "picklist", "Status",   40),
    ],

    # ─── Administration ─────────────────────────────────
    "risks": [
        F("title",      "Title",      "text",     "Identity", 10),
        F("category",   "Category",   "text",     "Classification", 20),
        F("likelihood", "Likelihood", "picklist", "Assessment",30),
        F("impact",     "Impact",     "picklist", "Assessment",31),
        F("status",     "Status",     "picklist", "Status",   40),
        F("mitigation", "Mitigation", "textarea", "Notes",    90),
    ],
    "licenses": [
        F("name",              "Name",              "text",     "Identity", 10),
        F("title",             "Title",             "text",     "Identity", 11),
        F("license_type",      "License Type",      "picklist", "Classification", 20),
        F("issuing_authority", "Issuing Authority", "text",     "Classification", 21),
        F("issue_date",        "Issue Date",        "date",     "Timeline", 30),
        F("expires_at",        "Expires At",        "date",     "Timeline", 31),
        F("status",            "Status",            "picklist", "Status",   40),
    ],
    "contracts": [
        F("contract_number", "Contract #",   "text",     "Identity", 10),
        F("title",           "Title",        "text",     "Identity", 11),
        F("party",           "Counterparty", "text",     "Identity", 12),
        F("value",           "Value",        "currency", "Financial",20),
        F("start_date",      "Start Date",   "date",     "Timeline", 30),
        F("end_date",        "End Date",     "date",     "Timeline", 31),
        F("renewal_date",    "Renewal Date", "date",     "Timeline", 32),
        F("status",          "Status",       "picklist", "Status",   40),
    ],
    "insurance_policies": [
        F("name",          "Name",           "text",     "Identity", 10),
        F("title",         "Title",          "text",     "Identity", 11),
        F("policy_number", "Policy Number",  "text",     "Identity", 12),
        F("coverage_type", "Coverage Type",  "picklist", "Classification", 20),
        F("premium",       "Premium",        "currency", "Financial",30),
        F("start_date",    "Start Date",     "date",     "Timeline", 40),
        F("renewal_date",  "Renewal Date",   "date",     "Timeline", 41),
        F("expires_at",    "Expires At",     "date",     "Timeline", 42),
        F("status",        "Status",         "picklist", "Status",   50),
    ],
    "board_meetings": [
        F("title",        "Title",        "text",     "Identity", 10),
        F("meeting_type", "Meeting Type", "picklist", "Classification", 20),
        F("meeting_date", "Meeting Date", "date",     "Timeline", 30),
        F("location",     "Location",     "text",     "Identity", 11),
        F("status",       "Status",       "picklist", "Status",   40),
    ],

    # ─── Marketing ──────────────────────────────────────
    "campaigns": [
        F("name",             "Name",            "text",     "Identity", 10),
        F("type",             "Type",            "picklist", "Classification", 20),
        F("status",           "Status",          "picklist", "Status",   30),
        F("start_date",       "Start Date",      "date",     "Timeline", 40),
        F("end_date",         "End Date",        "date",     "Timeline", 41),
        F("budget",           "Budget",          "currency", "Financial",50),
        F("leads_generated",  "Leads Generated", "number",   "Performance",60),
        F("conversions",      "Conversions",     "number",   "Performance",61),
    ],
    "contents": [
        F("title",        "Title",        "text",     "Identity", 10),
        F("subject",      "Subject",      "text",     "Identity", 11),
        F("content_type", "Content Type", "picklist", "Classification", 20),
        F("status",       "Status",       "picklist", "Status",   30),
        F("views",        "Views",        "number",   "Performance",40),
        F("shares",       "Shares",       "number",   "Performance",41),
    ],
    "campaign_activities": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("campaign_name", "Campaign",      "text",     "Identity", 11),
        F("campaign_id",   "Campaign Ref",  "entity_reference", "Identity", 12),
        F("activity_type", "Activity Type", "picklist", "Classification", 20),
        F("status",        "Status",        "picklist", "Status",   30),
        F("activity_date", "Activity Date", "date",     "Timeline", 40),
        F("notes",         "Notes",         "textarea", "Notes",    90),
    ],
    "campaign_metrics": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("campaign_name", "Campaign",      "text",     "Identity", 11),
        F("campaign_id",   "Campaign Ref",  "entity_reference", "Identity", 12),
        F("metric_type",   "Metric Type",   "picklist", "Classification", 20),
        F("value",         "Value",         "number",   "Performance", 30),
        F("recorded_date", "Recorded Date", "date",     "Timeline", 40),
    ],
    "marketing_email_templates": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("subject",       "Subject",       "text",     "Identity", 11),
        F("category",      "Category",      "picklist", "Classification", 20),
        F("status",        "Status",        "picklist", "Status",   30),
        F("body",          "Body",          "textarea", "Content",  40),
    ],
    "lead_activities": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("lead_name",     "Lead",          "text",     "Identity", 11),
        F("lead_id",       "Lead Ref",      "entity_reference", "Identity", 12),
        F("activity_type", "Activity Type", "picklist", "Classification", 20),
        F("activity_date", "Activity Date", "date",     "Timeline", 40),
        F("notes",         "Notes",         "textarea", "Notes",    90),
    ],
    "website_analytics": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("metric_type",   "Metric Type",   "picklist", "Classification", 20),
        F("value",         "Value",         "number",   "Performance", 30),
        F("page_url",      "Page URL",      "text",     "Identity", 11),
        F("recorded_date", "Recorded Date", "date",     "Timeline", 40),
    ],
    "segments": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("description",   "Description",   "textarea", "Identity", 11),
        F("status",        "Status",        "picklist", "Status",   20),
        F("criteria",      "Criteria",      "textarea", "Definition", 30),
        F("journey_name",  "Auto-enroll Journey", "text", "Definition", 31),
        F("member_count",  "Member Count",  "number",   "Performance", 40),
    ],
    "lists": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("description",   "Description",   "textarea", "Identity", 11),
        F("type",          "Type",          "picklist", "Classification", 20),
        F("status",        "Status",        "picklist", "Status",   30),
        F("member_count",  "Member Count",  "number",   "Performance", 40),
    ],
    "journeys": [
        F("name",            "Name",            "text",     "Identity", 10),
        F("description",     "Description",     "textarea", "Identity", 11),
        F("status",          "Status",          "picklist", "Status",   20),
        F("audience_entity", "Audience Entity", "text",     "Audience", 30),
        F("steps",           "Steps (JSON)",    "textarea", "Definition", 40),
        F("enrolled_count",  "Enrolled",        "number",   "Performance", 50),
    ],
    "journey_enrollments": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("journey_name",  "Journey",       "text",     "Identity", 11),
        F("subject_name",  "Subject",       "text",     "Identity", 12),
        F("subject_email", "Subject Email", "email",    "Identity", 13),
        F("status",        "Status",        "picklist", "Status",   20),
        F("current_step",  "Current Step",  "number",   "Progress", 30),
        F("enrolled_at",   "Enrolled At",   "date",     "Timeline", 40),
        F("next_run_at",   "Next Run At",   "date",     "Timeline", 41),
    ],
    "email_sends": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("template_name", "Template",      "text",     "Identity", 11),
        F("subject",       "Subject",       "text",     "Identity", 12),
        F("to_email",      "To Email",      "email",    "Recipient", 20),
        F("to_name",       "To Name",       "text",     "Recipient", 21),
        F("status",        "Status",        "picklist", "Status",   30),
        F("provider",      "Provider",      "text",     "Status",   31),
        F("sent_at",       "Sent At",       "date",     "Timeline", 40),
        F("opened_at",     "Opened At",     "date",     "Timeline", 41),
        F("journey_name",  "Journey",       "text",     "Source",   50),
    ],
    "scoring_rules": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("event",         "Event",         "text",     "Rule",     20),
        F("points",        "Points",        "number",   "Rule",     21),
        F("description",   "Description",   "textarea", "Identity", 11),
    ],
    "forms": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("description",   "Description",   "textarea", "Identity", 11),
        F("status",        "Status",        "picklist", "Status",   20),
        F("source",        "Lead Source",   "text",     "Capture",  30),
        F("scoring_event", "Scoring Event", "text",     "Capture",  31),
        F("journey_name",  "Enroll Journey","text",     "Capture",  32),
        F("fields",        "Fields (JSON)", "textarea", "Definition", 40),
        F("submissions",   "Submissions",   "number",   "Performance", 50),
    ],
    "form_submissions": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("form_name",     "Form",          "text",     "Identity", 11),
        F("lead_name",     "Lead",          "text",     "Identity", 12),
        F("lead_email",    "Email",         "email",    "Identity", 13),
        F("submitted_at",  "Submitted At",  "date",     "Timeline", 20),
    ],
    "suppressions": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("email",         "Email",         "email",    "Identity", 11),
        F("reason",        "Reason",        "picklist", "Identity", 20),
        F("suppressed_at", "Suppressed At", "date",     "Timeline", 30),
    ],
    "lead_score_events": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("lead_name",     "Lead",          "text",     "Identity", 11),
        F("event",         "Event",         "text",     "Engagement", 20),
        F("points",        "Points",        "number",   "Engagement", 21),
        F("old_score",     "Old Score",     "number",   "Engagement", 22),
        F("new_score",     "New Score",     "number",   "Engagement", 23),
        F("grade",         "Grade",         "picklist", "Engagement", 24),
        F("scored_at",     "Scored At",     "date",     "Timeline", 30),
    ],

    # ─── Automation ─────────────────────────────────────
    "automations": [
        F("name",            "Name",            "text",     "Identity", 10),
        F("description",     "Description",     "textarea", "Identity", 11),
        F("status",          "Status",          "picklist", "Status",   20),
        F("trigger_entity",  "Trigger Entity",  "text",     "Trigger",  30),
        F("trigger_event",   "Trigger Event",   "picklist", "Trigger",  31),
        F("condition_field", "Condition Field", "text",     "Condition",40),
        F("condition_op",    "Condition Op",    "picklist", "Condition",41),
        F("condition_value", "Condition Value", "text",     "Condition",42),
        F("action_type",     "Action",          "picklist", "Action",   50),
        F("action_field",    "Action Field",    "text",     "Action",   51),
        F("action_value",    "Action Value",    "text",     "Action",   52),
        F("idempotent",      "Idempotent",      "picklist", "Action",   53),
    ],
    "automation_runs": [
        F("name",            "Name",            "text",     "Identity", 10),
        F("automation_name", "Automation",      "text",     "Identity", 11),
        F("trigger_entity",  "Trigger Entity",  "text",     "Trigger",  20),
        F("record_id",       "Record",          "text",     "Trigger",  21),
        F("action_type",     "Action",          "text",     "Action",   30),
        F("status",          "Status",          "picklist", "Status",   40),
        F("detail",          "Detail",          "textarea", "Result",   50),
        F("run_at",          "Run At",          "date",     "Timeline", 60),
    ],
    "action_ledger": [
        F("name",            "Name",            "text",     "Identity", 10),
        F("action_type",     "Action",          "text",     "Action",   11),
        F("target_entity",   "Target Entity",   "text",     "Target",   12),
        F("target_record_id","Target Record",   "text",     "Target",   13),
        F("source",          "Source Rule",     "text",     "Action",   14),
        F("reversible",      "Reversible",      "text",     "Status",   20),
        F("reversed",        "Reversed",        "text",     "Status",   21),
        F("detail",          "Detail",          "textarea", "Result",   30),
        F("undo_detail",     "Undo Detail",     "textarea", "Result",   31),
        F("run_at",          "Run At",          "date",     "Timeline", 40),
        F("reversed_at",     "Reversed At",     "date",     "Timeline", 41),
    ],
    "ai_jobs": [
        F("name",            "Name",            "text",     "Identity", 10),
        F("capability",      "Capability",      "picklist", "Job",      11),
        F("module_code",     "Module",          "text",     "Job",      12),
        F("entity_type",     "Section",         "text",     "Job",      13),
        F("record_id",       "Record",          "text",     "Job",      14),
        F("target_field",    "Target Field",    "text",     "Job",      15),
        F("source_automation","Source Rule",    "text",     "Job",      16),
        F("status",          "Status",          "picklist", "Status",   20),
        F("result",          "Result",          "textarea", "Result",   30),
        F("model",           "Model",           "text",     "Result",   31),
        F("cost_usd",        "Cost (USD)",      "number",   "Result",   32),
        F("error",           "Error",           "textarea", "Result",   33),
        F("decision",        "Decision",        "text",     "Policy",   34),
        F("risk",            "Risk",            "text",     "Policy",   35),
        F("attempts",        "Attempts",        "number",   "Retry",    36),
        F("max_attempts",    "Max Attempts",    "number",   "Retry",    37),
        F("queued_at",       "Queued At",       "date",     "Timeline", 40),
        F("next_attempt_at", "Next Attempt At", "date",     "Timeline", 42),
        F("ran_at",          "Ran At",          "date",     "Timeline", 41),
    ],

    # ─── Analytics ──────────────────────────────────────
    "funnel_snapshots": [
        F("name",          "Name",          "text",     "Identity", 10),
        F("snapshot_date", "Date",          "date",     "Identity", 11),
        F("leads",         "Leads",         "number",   "Funnel",   20),
        F("mql",           "MQL",           "number",   "Funnel",   21),
        F("sql",           "SQL",           "number",   "Funnel",   22),
        F("won",           "Won",           "number",   "Funnel",   23),
        F("win_rate",      "Win Rate %",    "number",   "Sales",    30),
        F("open_pipeline", "Open Pipeline", "currency", "Sales",    31),
        F("won_revenue",   "Won Revenue",   "currency", "Sales",    32),
    ],

    # ─── R&D ────────────────────────────────────────────
    "experiments": [
        F("name",       "Name",        "text",     "Identity", 10),
        F("title",      "Title",       "text",     "Identity", 11),
        F("researcher", "Researcher",  "text",     "Identity", 12),
        F("hypothesis", "Hypothesis",  "textarea", "Identity", 13),
        F("status",     "Status",      "picklist", "Status",   20),
        F("start_date", "Start Date",  "date",     "Timeline", 30),
    ],

    # ─── HR (already cleaned up earlier — leave employees alone) ─
    "leave_requests": [
        F("employee_name", "Employee Name", "text",     "Identity", 10),
        F("employee_id",   "Employee Ref",  "entity_reference", "Identity", 11),
        F("leave_type",    "Leave Type",    "picklist", "Classification", 20),
        F("status",        "Status",        "picklist", "Status",   30),
        F("start_date",    "Start Date",    "date",     "Timeline", 40),
        F("end_date",      "End Date",      "date",     "Timeline", 41),
        F("total_days",    "Total Days",    "number",   "Timeline", 42),
        F("reason",        "Reason",        "textarea", "Notes",    90),
    ],
    "applications": [
        F("name",         "Name",         "text",     "Identity", 10),
        F("first_name",   "First Name",   "text",     "Identity", 11),
        F("last_name",    "Last Name",    "text",     "Identity", 12),
        F("email",        "Email",        "email",    "Contact",  20),
        F("phone",        "Phone",        "phone",    "Contact",  21),
        F("job_title",    "Job Title",    "text",     "Position", 30),
        F("status",       "Status",       "picklist", "Status",   40),
        F("source",       "Source",       "text",     "Source",   50),
        F("applied_date", "Applied Date", "date",     "Timeline", 60),
    ],
    "applicants": [
        F("name",         "Name",         "text",     "Identity", 10),
        F("first_name",   "First Name",   "text",     "Identity", 11),
        F("last_name",    "Last Name",    "text",     "Identity", 12),
        F("email",        "Email",        "email",    "Contact",  20),
        F("phone",        "Phone",        "phone",    "Contact",  21),
        F("job_title",    "Job Title",    "text",     "Position", 30),
        F("status",       "Status",       "picklist", "Status",   40),
        F("applied_date", "Applied Date", "date",     "Timeline", 50),
    ],
    "attendance": [
        F("employee_id",     "Employee Ref",   "entity_reference", "Identity", 10),
        F("attendance_date", "Attendance Date","date",     "Timeline", 20),
        F("status",          "Status",         "picklist", "Status",   30),
        F("total_hours",     "Total Hours",    "number",   "Timing",   40),
        F("check_in",        "Check In",       "text",     "Timing",   41),
        F("check_out",       "Check Out",      "text",     "Timing",   42),
    ],

    # ─── Misc ──────────────────────────────────────────
    "subscriptions": [
        F("vendor",        "Vendor",        "text",     "Identity", 10),
        F("product_name",  "Product",       "text",     "Identity", 11),
        F("cost",          "Cost",          "currency", "Financial",20),
        F("billing_cycle", "Billing Cycle", "picklist", "Financial",21),
        F("status",        "Status",        "picklist", "Status",   30),
        F("start_date",    "Start Date",    "date",     "Timeline", 40),
        F("renewal_date",  "Renewal Date",  "date",     "Timeline", 41),
    ],
    "assets": [
        F("asset_tag",     "Asset Tag",     "text",     "Identity", 10),
        F("name",          "Name",          "text",     "Identity", 11),
        F("category",      "Category",      "picklist", "Classification", 20),
        F("value",         "Value",         "currency", "Financial",30),
        F("purchase_date", "Purchase Date", "date",     "Timeline", 40),
        F("location",      "Location",      "text",     "Identity", 12),
        F("status",        "Status",        "picklist", "Status",   50),
    ],
    "credentials": [
        F("name",       "Name",       "text",     "Identity", 10),
        F("service",    "Service",    "text",     "Identity", 11),
        F("username",   "Username",   "text",     "Auth",     20),
        F("category",   "Category",   "picklist", "Classification", 30),
        F("expires_at", "Expires At", "date",     "Timeline", 40),
        F("is_active",  "Active",     "boolean",  "Status",   50),
    ],
    "documents": [
        F("title",         "Title",         "text",     "Identity", 10),
        F("category",      "Category",      "picklist", "Classification", 20),
        F("description",   "Description",   "textarea", "Identity", 12),
        F("version",       "Version",       "text",     "Storage",  30),
        F("uploaded_date", "Uploaded Date", "date",     "Timeline", 40),
    ],
}


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()
    inserted = 0
    updated  = 0

    for entity_type, fields in SCHEMAS.items():
        for name, label, ftype, picklist, group, order in fields:
            cur.execute(
                "SELECT id FROM custom_field_definitions "
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
                cur.execute(
                    """
                    UPDATE custom_field_definitions
                       SET field_group   = %s,
                           display_order = %s,
                           last_modified_by   = %s,
                           last_modified_date = NOW()
                     WHERE id = %s
                    """,
                    (group, order, SYS, row[0]),
                )
                updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()
    print(f"Inserted {inserted} new field definitions; regrouped {updated} existing.")


if __name__ == "__main__":
    main()
