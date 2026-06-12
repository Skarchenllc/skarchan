#!/usr/bin/env python3
"""
Seed picklist field definitions across all relevant entities so the shared
EntityList renders "All <Field>" filter dropdowns (like the General Ledger
"All Account Types" filter) in every list view.

Idempotent: for each (entity_type, field_name) pair we either
  - insert the picklist field if it doesn't exist, or
  - update picklist_values on an existing row if it currently has none.

Existing user-configured options are left untouched.
"""
import os
import json
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
SYSTEM_USER = "00000000-0000-0000-0000-000000000001"

# (entity_type, field_name, field_label, picklist_values, display_order, group)
PICKLISTS = [
    # ---------------- Accounting ----------------
    ("accounts",                 "account_type",   "Account Type",   ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"], 10, "Classification"),
    ("accounts",                 "status",         "Status",         ["Active", "Inactive", "Archived"], 11, "Classification"),
    ("transactions",             "type",           "Type",           ["Debit", "Credit"], 10, "Classification"),
    ("transactions",             "status",         "Status",         ["Pending", "Posted", "Reversed"], 11, "Classification"),
    ("transactions",             "account_type",   "Account Type",   ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"], 12, "Classification"),
    ("journal",                  "status",         "Status",         ["Draft", "Posted", "Reversed"], 10, "Classification"),
    ("journal_entries",          "status",         "Status",         ["Draft", "Posted", "Reversed"], 10, "Classification"),
    ("ledgers",                  "account_type",   "Account Type",   ["Assets", "Liabilities", "Equity", "Revenue", "Expenses"], 10, "Classification"),
    ("ledgers",                  "status",         "Status",         ["Open", "Closed", "Archived"], 11, "Classification"),
    ("invoices",                 "status",         "Status",         ["Draft", "Sent", "Paid", "Partially Paid", "Overdue", "Cancelled"], 10, "Status"),
    ("invoice_payments",         "status",         "Status",         ["Pending", "Cleared", "Failed", "Refunded"], 10, "Status"),
    ("payment_reminders",        "status",         "Status",         ["Scheduled", "Sent", "Cancelled"], 10, "Status"),
    ("bills",                    "status",         "Status",         ["Draft", "Approved", "Paid", "Partially Paid", "Overdue", "Cancelled"], 10, "Status"),
    ("bill_payments",            "status",         "Status",         ["Pending", "Cleared", "Failed", "Voided"], 10, "Status"),
    ("batch_payments",           "status",         "Status",         ["Pending", "Processing", "Completed", "Failed"], 10, "Status"),
    ("purchase_orders",          "status",         "Status",         ["Draft", "Sent", "Acknowledged", "Received", "Closed", "Cancelled"], 10, "Status"),
    ("po_receipts",              "status",         "Status",         ["Pending", "Received", "Partial", "Rejected"], 10, "Status"),
    ("bank_accounts",            "account_type",   "Account Type",   ["Checking", "Savings", "Credit Card", "Loan", "Investment", "Cash"], 10, "Classification"),
    ("bank_accounts",            "status",         "Status",         ["Active", "Closed", "Frozen"], 11, "Classification"),
    ("bank_reconciliations",     "status",         "Status",         ["In Progress", "Completed", "Discrepant"], 10, "Status"),
    ("budgets",                  "status",         "Status",         ["Draft", "Approved", "Active", "Closed"], 10, "Status"),
    ("budgets",                  "period",         "Period",         ["Monthly", "Quarterly", "Yearly"], 11, "Classification"),
    ("budget_revisions",         "status",         "Status",         ["Draft", "Approved", "Rejected"], 10, "Status"),
    ("payroll_runs",             "status",         "Status",         ["Draft", "Processed", "Paid", "Cancelled"], 10, "Status"),
    ("payslips",                 "status",         "Status",         ["Pending", "Processed", "Paid", "Cancelled"], 10, "Status"),
    ("fixed_assets",             "status",         "Status",         ["Active", "In Maintenance", "Disposed", "Sold"], 10, "Status"),
    ("fixed_assets",             "category",       "Category",       ["Buildings", "Vehicles", "IT Equipment", "Furniture", "Machinery", "Other"], 11, "Classification"),
    ("depreciation",             "method",         "Method",         ["Straight Line", "Declining Balance", "Sum of Years", "Units of Production"], 10, "Method"),
    ("subscriptions",            "status",         "Status",         ["Active", "Cancelled", "Paused", "Trial", "Expired"], 10, "Status"),
    ("subscriptions",            "billing_cycle",  "Billing Cycle",  ["Monthly", "Quarterly", "Annual", "One-time"], 11, "Financial"),
    ("currencies",               "status",         "Status",         ["Active", "Inactive"], 10, "Status"),
    ("tax_rates",                "type",           "Type",           ["Sales", "Purchase", "VAT", "GST", "Withholding"], 10, "Classification"),
    ("accounting_periods",       "status",         "Status",         ["Open", "Closed", "Locked"], 10, "Status"),
    ("period_closings",          "status",         "Status",         ["In Progress", "Completed", "Reopened"], 10, "Status"),
    ("year_end_closings",        "status",         "Status",         ["In Progress", "Completed", "Reopened"], 10, "Status"),

    # ---------------- Sales / CRM ----------------
    ("customers",                "status",         "Status",         ["Active", "Inactive", "Prospect", "Archived"], 10, "Status"),
    ("customers",                "type",           "Type",           ["Individual", "Business"], 11, "Classification"),
    ("leads",                    "status",         "Status",         ["New", "Contacted", "Qualified", "Unqualified", "Converted"], 10, "Status"),
    ("leads",                    "source",         "Source",         ["Website", "Referral", "Cold Call", "Trade Show", "Social", "Other"], 11, "Source"),
    ("leads",                    "grade",          "Grade",          ["Cold", "Warm", "Hot"], 12, "Scoring"),
    ("opportunities",            "stage",          "Stage",          ["Prospecting", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"], 10, "Stage"),
    ("opportunities",            "priority",       "Priority",       ["Low", "Medium", "High"], 11, "Priority"),
    ("opportunities",            "win_reason",     "Win Reason",     ["Product Fit", "Price", "Relationship", "Features", "Support", "Timing"], 12, "Outcome"),
    ("opportunities",            "loss_reason",    "Loss Reason",    ["Price", "Competitor", "No Budget", "No Decision", "Timing", "Status Quo", "Other"], 13, "Outcome"),
    ("contacts",                 "status",         "Status",         ["Active", "Inactive"], 10, "Status"),
    ("sales_accounts",           "type",           "Type",           ["Prospect", "Customer", "Partner"], 10, "Classification"),
    ("campaigns",                "status",         "Status",         ["Draft", "Active", "Paused", "Completed", "Cancelled"], 10, "Status"),
    ("campaigns",                "type",           "Type",           ["Email", "Social", "Paid Ads", "Event", "Content", "Other"], 11, "Classification"),
    ("orders",                   "status",         "Status",         ["Pending", "Paid", "Shipped", "Delivered", "Cancelled", "Refunded"], 10, "Status"),
    ("orders",                   "payment_status", "Payment Status", ["Unpaid", "Partial", "Paid", "Refunded"], 11, "Status"),
    ("quotes",                   "status",         "Status",         ["Draft", "Sent", "Accepted", "Rejected", "Expired"], 10, "Status"),
    ("activities",               "type",           "Type",           ["Call", "Meeting", "Email", "Task", "Note"], 10, "Classification"),
    ("activities",               "status",         "Status",         ["Open", "In Progress", "Completed", "Cancelled"], 11, "Status"),
    ("activities",               "priority",       "Priority",       ["Low", "Medium", "High"], 12, "Priority"),
    ("sales_products",           "status",         "Status",         ["Active", "Inactive", "Discontinued"], 10, "Status"),
    ("sales_products",           "unit",           "Unit",           ["Each", "Hour", "License", "Subscription", "Day"], 11, "Pricing"),
    ("sales_products",           "category",       "Category",       ["Software", "Hardware", "Service", "Subscription", "Support"], 12, "Classification"),

    # ---------------- HR ----------------
    ("employees",                "status",         "Status",         ["Active", "On Leave", "Terminated"], 10, "Status"),
    ("employees",                "employment_type","Employment Type",["Full-time", "Part-time", "Contractor", "Intern"], 11, "Classification"),
    ("applications",             "status",         "Status",         ["Applied", "Screening", "Interviewing", "Offered", "Hired", "Rejected", "Withdrawn"], 10, "Status"),
    ("applicants",               "status",         "Status",         ["Applied", "Screening", "Interviewing", "Offered", "Hired", "Rejected"], 10, "Status"),
    ("job_postings",             "status",         "Status",         ["Open", "Closed", "Filled", "On Hold"], 10, "Status"),
    ("leaves",                   "status",         "Status",         ["Pending", "Approved", "Rejected", "Cancelled"], 10, "Status"),
    ("leaves",                   "leave_type",     "Leave Type",     ["Annual", "Sick", "Personal", "Maternity", "Paternity", "Bereavement", "Unpaid"], 11, "Classification"),
    ("performance_reviews",      "status",         "Status",         ["Draft", "In Progress", "Submitted", "Approved"], 10, "Status"),

    # ---------------- Projects / R&D ----------------
    ("projects",                 "status",         "Status",         ["Planning", "Active", "On Hold", "Completed", "Cancelled"], 10, "Status"),
    ("projects",                 "priority",       "Priority",       ["Low", "Medium", "High", "Critical"], 11, "Priority"),
    ("tasks",                    "status",         "Status",         ["Todo", "In Progress", "Done", "Blocked"], 10, "Status"),
    ("tasks",                    "priority",       "Priority",       ["Low", "Medium", "High", "Critical"], 11, "Priority"),
    ("milestones",               "status",         "Status",         ["Planned", "In Progress", "Achieved", "Missed"], 10, "Status"),
    ("strategic_initiatives",    "status",         "Status",         ["Proposed", "Approved", "In Progress", "Completed", "Cancelled"], 10, "Status"),
    ("strategic_initiatives",    "priority",       "Priority",       ["Low", "Medium", "High", "Critical"], 11, "Priority"),
    ("research_projects",        "status",         "Status",         ["Planning", "Active", "Paused", "Completed", "Cancelled"], 10, "Status"),
    ("experiments",              "status",         "Status",         ["Planned", "Running", "Completed", "Aborted"], 10, "Status"),

    # ---------------- Inventory / Production / SCM ----------------
    ("inventory",                "status",         "Status",         ["In Stock", "Low Stock", "Out of Stock", "Reserved", "Discontinued"], 10, "Status"),
    ("stock_items",              "status",         "Status",         ["In Stock", "Low Stock", "Out of Stock", "Reserved"], 10, "Status"),
    ("warehouses",               "status",         "Status",         ["Active", "Inactive", "Under Maintenance"], 10, "Status"),
    ("production_orders",        "status",         "Status",         ["Planned", "In Progress", "Completed", "On Hold", "Cancelled"], 10, "Status"),
    ("work_orders",              "status",         "Status",         ["Pending", "In Progress", "Completed", "Cancelled"], 10, "Status"),
    ("shipments",                "status",         "Status",         ["Pending", "In Transit", "Delivered", "Returned", "Lost"], 10, "Status"),
    ("suppliers",                "status",         "Status",         ["Active", "Inactive", "Suspended"], 10, "Status"),
    ("vendors",                  "status",         "Status",         ["Active", "Inactive", "Suspended"], 10, "Status"),
    ("vendors",                  "type",           "Type",           ["Supplier", "Service Provider", "Contractor", "Consultant"], 11, "Classification"),

    # ---------------- Customer Service ----------------
    ("service_tickets",          "status",         "Status",         ["New", "In Progress", "Pending", "Resolved", "Closed"], 10, "Status"),
    ("service_tickets",          "priority",       "Priority",       ["Low", "Medium", "High", "Urgent"], 11, "Priority"),
    ("support_cases",            "status",         "Status",         ["Open", "In Progress", "Resolved", "Closed"], 10, "Status"),
    ("support_cases",            "priority",       "Priority",       ["Low", "Medium", "High", "Urgent"], 11, "Priority"),

    # ---------------- Administration (already partially seeded by admin script) ----------------
    ("risks",                    "likelihood",     "Likelihood",     ["Low", "Medium", "High"], 10, "Assessment"),
    ("risks",                    "impact",         "Impact",         ["Low", "Medium", "High"], 11, "Assessment"),
    ("risks",                    "status",         "Status",         ["Identified", "Mitigating", "Accepted", "Closed"], 12, "Status"),
    ("licenses",                 "status",         "Status",         ["Active", "Pending Renewal", "Expired", "Cancelled"], 10, "Status"),
    ("board_meetings",           "status",         "Status",         ["Scheduled", "Completed", "Cancelled"], 10, "Status"),
    ("board_meetings",           "meeting_type",   "Meeting Type",   ["Annual", "Quarterly", "Special", "Emergency"], 11, "Classification"),
    ("insurance_policies",       "status",         "Status",         ["Active", "Lapsed", "Cancelled", "Pending"], 10, "Status"),
    ("contracts",                "status",         "Status",         ["Draft", "Active", "Expired", "Terminated", "Renewed"], 10, "Status"),
    ("documents",                "category",       "Category",       ["Policy", "Contract", "Report", "Manual", "Image", "Other"], 10, "Classification"),
    ("credentials",              "category",       "Category",       ["API Key", "Service Account", "Database", "SSH Key", "Web Login", "Other"], 10, "Classification"),
    ("workflows",                "status",         "Status",         ["Active", "Inactive", "Draft"], 10, "Status"),

    # ---------------- Accounting (gap-fillers) ----------------
    ("budget_lines",             "status",         "Status",         ["Planned", "Committed", "Spent", "Overrun"], 10, "Status"),
    ("budget_alerts",            "status",         "Status",         ["Open", "Acknowledged", "Resolved"], 10, "Status"),
    ("budget_alerts",            "severity",       "Severity",       ["Info", "Warning", "Critical"], 11, "Classification"),
    ("budget_scenarios",         "status",         "Status",         ["Draft", "Approved", "Active", "Archived"], 10, "Status"),
    ("budget_templates",         "status",         "Status",         ["Active", "Inactive", "Draft"], 10, "Status"),
    ("salary_structures",        "status",         "Status",         ["Active", "Inactive", "Draft"], 10, "Status"),
    ("salary_structures",        "frequency",      "Frequency",      ["Monthly", "Bi-Weekly", "Weekly", "Annual"], 11, "Classification"),
    ("reconciliation_items",     "status",         "Status",         ["Unmatched", "Matched", "Cleared", "Disputed"], 10, "Status"),
    ("bank_statements",          "status",         "Status",         ["Imported", "Reconciled", "Discrepant"], 10, "Status"),
    ("bank_statement_transactions","status",       "Status",         ["Unmatched", "Matched", "Cleared", "Ignored"], 10, "Status"),
    ("currency_exchange_transactions","type",      "Type",           ["Buy", "Sell"], 10, "Classification"),
    ("currency_exchange_transactions","status",    "Status",         ["Pending", "Completed", "Failed"], 11, "Status"),
    ("exchange_rates",           "status",         "Status",         ["Active", "Historical"], 10, "Status"),
    ("period_adjustments",       "status",         "Status",         ["Draft", "Posted", "Reversed"], 10, "Status"),
    ("unrealized_gain_loss",     "type",           "Type",           ["Gain", "Loss"], 10, "Classification"),
    ("accounting_customers",     "status",         "Status",         ["Active", "Inactive", "Prospect"], 10, "Status"),
    ("accounting_customers",     "type",           "Type",           ["Individual", "Business"], 11, "Classification"),

    # ---------------- HR (gap-fillers) ----------------
    ("attendance",               "status",         "Status",         ["Present", "Absent", "Late", "Leave"], 10, "Status"),
    ("assessments",              "status",         "Status",         ["Scheduled", "In Progress", "Completed", "Cancelled"], 10, "Status"),
    ("interviews",               "status",         "Status",         ["Scheduled", "Completed", "Cancelled", "No Show"], 10, "Status"),
    ("interviews",               "round",          "Round",          ["Phone Screen", "Technical", "Onsite", "Final"], 11, "Classification"),
    ("job_offers",               "status",         "Status",         ["Draft", "Sent", "Accepted", "Declined", "Expired"], 10, "Status"),
    ("job_requisitions",         "status",         "Status",         ["Open", "On Hold", "Filled", "Cancelled"], 10, "Status"),
    ("leave_balances",           "leave_type",     "Leave Type",     ["Annual", "Sick", "Personal", "Maternity", "Paternity"], 10, "Classification"),
    ("leave_requests",           "status",         "Status",         ["Pending", "Approved", "Rejected", "Cancelled"], 10, "Status"),
    ("leave_requests",           "leave_type",     "Leave Type",     ["Annual", "Sick", "Personal", "Maternity", "Paternity", "Bereavement", "Unpaid"], 11, "Classification"),
    ("commissions",              "status",         "Status",         ["Pending", "Approved", "Paid", "Cancelled"], 10, "Status"),
    ("benefits_plans",           "status",         "Status",         ["Active", "Inactive", "Pending"], 10, "Status"),
    ("training_programs",        "status",         "Status",         ["Scheduled", "In Progress", "Completed", "Cancelled"], 10, "Status"),
    ("certifications",           "status",         "Status",         ["Active", "Expired", "Pending Renewal"], 10, "Status"),
    ("skill_assessments",        "status",         "Status",         ["Pending", "Completed", "Reviewed"], 10, "Status"),
    ("reports",                  "type",           "Type",           ["Headcount", "Attendance", "Payroll", "Performance", "Custom"], 10, "Classification"),

    # ---------------- Administration (gap-fillers) ----------------
    ("legal_cases",              "status",         "Status",         ["Open", "In Litigation", "Settled", "Closed"], 10, "Status"),
    ("legal_cases",              "case_type",      "Case Type",      ["Civil", "Criminal", "Regulatory", "Employment", "Contract"], 11, "Classification"),
    ("legal_cases",              "priority",       "Priority",       ["Low", "Medium", "High", "Critical"], 12, "Priority"),
    ("compliance_policies",      "status",         "Status",         ["Draft", "Active", "Under Review", "Retired"], 10, "Status"),
    ("compliance_audits",        "status",         "Status",         ["Planned", "In Progress", "Completed", "Failed"], 10, "Status"),
    ("compliance_audits",        "result",         "Result",         ["Pass", "Fail", "Pending", "Conditional"], 11, "Classification"),
    ("executive_board",          "status",         "Status",         ["Active", "Inactive", "Former"], 10, "Status"),
    ("executive_board",          "role",           "Role",           ["Chair", "Vice Chair", "Member", "Observer"], 11, "Classification"),

    # ---------------- Marketing (gap-fillers) ----------------
    ("campaign_activities",      "activity_type",  "Activity Type",  ["Email Sent", "Post Published", "Ad Launched", "Call", "Event"], 9, "Classification"),
    ("campaign_activities",      "status",         "Status",         ["Planned", "In Progress", "Completed", "Cancelled"], 10, "Status"),
    ("campaign_metrics",         "metric_type",    "Metric Type",    ["Impressions", "Clicks", "Conversions", "Revenue"], 10, "Classification"),
    ("marketing_email_templates","status",         "Status",         ["Draft", "Active", "Archived"], 10, "Status"),
    ("marketing_email_templates","category",       "Category",       ["Marketing", "Transactional", "Welcome", "Notification"], 11, "Classification"),
    ("lead_activities",          "activity_type",  "Activity Type",  ["Email Opened", "Link Clicked", "Form Submitted", "Call Made", "Meeting"], 10, "Classification"),
    ("contents",                 "status",         "Status",         ["Draft", "Review", "Published", "Archived"], 10, "Status"),
    ("contents",                 "content_type",   "Content Type",   ["Article", "Blog", "Video", "Image", "Whitepaper"], 11, "Classification"),
    ("website_analytics",        "metric_type",    "Metric Type",    ["Pageviews", "Sessions", "Users", "Conversions"], 10, "Classification"),
    ("segments",                 "status",         "Status",         ["Active", "Draft", "Archived"], 10, "Status"),
    ("lists",                    "type",           "Type",           ["Static", "Dynamic", "Suppression"], 10, "Classification"),
    ("lists",                    "status",         "Status",         ["Active", "Draft", "Archived"], 11, "Status"),
    ("journeys",                 "status",         "Status",         ["Active", "Draft", "Archived"], 10, "Status"),
    ("journey_enrollments",      "status",         "Status",         ["Active", "Completed", "Stopped"], 10, "Status"),
    ("email_sends",              "status",         "Status",         ["Queued", "Sent", "Delivered", "Opened", "Clicked", "Bounced", "Failed"], 10, "Status"),
    ("lead_score_events",        "grade",          "Grade",          ["Cold", "Warm", "Hot"], 10, "Engagement"),
    ("forms",                    "status",         "Status",         ["Active", "Draft", "Archived"], 10, "Status"),
    ("suppressions",             "reason",         "Reason",         ["unsubscribe", "bounce", "complaint", "manual"], 10, "Identity"),

    # ---------------- Automation ----------------
    ("automations",              "status",         "Status",         ["Active", "Paused"], 10, "Status"),
    ("automations",              "trigger_event",  "Trigger Event",  ["created", "updated", "field_changed"], 11, "Trigger"),
    ("automations",              "condition_op",   "Condition Op",   ["equals", "not_equals", "greater_than", "less_than", "contains", "changed", "is_empty"], 12, "Condition"),
    ("automations",              "action_type",    "Action",         ["set_field", "create_activity", "send_email", "enroll_journey", "ai_run", "log"], 13, "Action"),
    ("automation_runs",          "status",         "Status",         ["success", "failed", "skipped"], 10, "Status"),
    ("automations",              "idempotent",     "Idempotent",     ["true", "false"], 14, "Action"),
    ("ai_jobs",                  "status",         "Status",         ["Queued", "Done", "Failed", "Pending Review", "Blocked"], 10, "Status"),
    ("ai_jobs",                  "capability",     "Capability",     ["summarize", "extract", "classify", "risk_scan", "ask"], 11, "Job"),
    ("action_ledger",            "action_type",    "Action",         ["set_field", "create_activity", "send_email", "enroll_journey", "ai_run", "ai_write_back"], 10, "Action"),
    ("advertisements",           "status",         "Status",         ["Draft", "Active", "Paused", "Completed"], 10, "Status"),

    # ---------------- Customer Service (gap-fillers) ----------------
    ("knowledge_base",           "status",         "Status",         ["Draft", "Published", "Archived"], 10, "Status"),
    ("knowledge_base",           "category",       "Category",       ["FAQ", "How-to", "Troubleshooting", "Reference"], 11, "Classification"),
    ("customer_feedback",        "status",         "Status",         ["New", "Reviewed", "Actioned", "Closed"], 10, "Status"),
    ("customer_feedback",        "sentiment",      "Sentiment",      ["Positive", "Neutral", "Negative"], 11, "Classification"),

    # ---------------- Production (gap-fillers) ----------------
    ("bill_of_materials",        "status",         "Status",         ["Draft", "Active", "Obsolete"], 10, "Status"),
    ("lab_equipment",            "status",         "Status",         ["Available", "In Use", "Maintenance", "Decommissioned"], 10, "Status"),
]


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()
    inserted = 0
    updated = 0

    for entity_type, field_name, field_label, picklist, display_order, field_group in PICKLISTS:
        cur.execute(
            """
            SELECT id, field_type, picklist_values
              FROM custom_field_definitions
             WHERE entity_type = %s AND field_name = %s AND deleted_flag = false
             LIMIT 1
            """,
            (entity_type, field_name),
        )
        row = cur.fetchone()
        if row is None:
            # Insert a new picklist field.
            cur.execute(
                """
                INSERT INTO custom_field_definitions
                    (field_name, field_label, field_type, entity_type, is_required,
                     picklist_values, display_order, is_visible, field_group,
                     created_by, last_modified_by)
                VALUES (%s, %s, 'picklist', %s, false, %s::jsonb, %s, true, %s, %s, %s)
                ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING
                """,
                (field_name, field_label, entity_type,
                 json.dumps(picklist), display_order, field_group,
                 SYSTEM_USER, SYSTEM_USER),
            )
            inserted += cur.rowcount
        else:
            existing_id, existing_type, existing_pv = row
            # Only backfill if the existing row has no picklist values yet —
            # don't overwrite anything the user has already customized.
            if existing_pv in (None, [], {}):
                cur.execute(
                    """
                    UPDATE custom_field_definitions
                       SET picklist_values = %s::jsonb,
                           field_type      = CASE WHEN field_type IN ('text','select','picklist')
                                                  THEN 'picklist' ELSE field_type END,
                           last_modified_by   = %s,
                           last_modified_date = NOW()
                     WHERE id = %s
                    """,
                    (json.dumps(picklist), SYSTEM_USER, existing_id),
                )
                updated += cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f"Inserted {inserted} new picklist fields; backfilled {updated} existing fields.")


if __name__ == "__main__":
    main()
