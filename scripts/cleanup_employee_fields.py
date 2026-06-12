#!/usr/bin/env python3
"""
Cleans up `employees` custom_field_definitions:
  - Soft-deletes redundant duplicate fields (e.g. employee_id when
    employee_code exists; phone when work_phone/personal_phone exist).
  - Assigns `field_group` to every remaining field so the preview modal
    can render fields in logical sections.
  - Renumbers `display_order` so groups cluster together.

Idempotent — running twice has no extra effect.
"""
import os
import psycopg2

DSN = os.environ.get("DSN") or "host=localhost port=5632 dbname=business_management user=postgres password=postgres"
SYS = "00000000-0000-0000-0000-000000000001"

# Fields to soft-delete because a better alternative exists.
DROP = [
    'employee_id',           # use employee_code
    'phone',                 # use work_phone / personal_phone
    'email',                 # use work_email / personal_email
    'address',               # use address_line1 + city + state + zip_code
    'status',                # use employment_status
    'manager_id',            # use manager
    'reports_to_name',       # use manager
    'department_id',         # use department
    'emergency_contact',     # use emergency_contact_name
    'emergency_phone',       # use emergency_contact_phone
]

# Ordered groups → fields. Order in this list IS the display order.
GROUPS = [
    ("Identity", [
        "employee_code", "first_name", "middle_name", "last_name",
        "preferred_name", "date_of_birth", "gender", "marital_status",
        "nationality",
    ]),
    ("Contact", [
        "work_email", "personal_email",
        "work_phone", "personal_phone",
        "address_line1", "address_line2",
        "city", "state", "zip_code", "country",
    ]),
    ("Emergency Contact", [
        "emergency_contact_name",
        "emergency_contact_phone",
        "emergency_contact_relationship",
    ]),
    ("Employment", [
        "job_title", "job_level", "department", "manager",
        "hire_date", "probation_end_date",
        "employment_type", "employment_status",
        "office_location", "work_arrangement",
        "termination_date", "termination_reason",
    ]),
    ("Compensation & Benefits", [
        "salary", "benefits_eligible", "benefits_start_date",
    ]),
    ("Performance", [
        "performance_rating", "last_review_date", "next_review_date",
    ]),
    ("Identity Documents", [
        "ssn", "passport_number", "drivers_license",
    ]),
    ("Other", [
        "profile_photo_url", "skills", "certifications", "education", "documents",
    ]),
]


def main():
    conn = psycopg2.connect(DSN)
    conn.autocommit = False
    cur = conn.cursor()

    # 1) Soft-delete duplicates.
    cur.execute(
        """
        UPDATE custom_field_definitions
           SET deleted_flag = true,
               last_modified_by = %s,
               last_modified_date = NOW()
         WHERE entity_type = 'employees'
           AND deleted_flag = false
           AND field_name = ANY(%s)
        """,
        (SYS, DROP),
    )
    deleted = cur.rowcount

    # 2) Walk groups → set field_group and display_order.
    order = 0
    updated = 0
    not_found = []
    for group_name, field_names in GROUPS:
        for fname in field_names:
            order += 10
            cur.execute(
                """
                UPDATE custom_field_definitions
                   SET field_group     = %s,
                       display_order   = %s,
                       last_modified_by   = %s,
                       last_modified_date = NOW()
                 WHERE entity_type = 'employees'
                   AND field_name  = %s
                   AND deleted_flag = false
                """,
                (group_name, order, SYS, fname),
            )
            if cur.rowcount == 0:
                not_found.append(fname)
            else:
                updated += cur.rowcount

    # 3) Anything left ungrouped goes to "Other" with display_order pushed past
    # the explicit groups.
    cur.execute(
        """
        UPDATE custom_field_definitions
           SET field_group   = 'Other',
               display_order = %s + display_order,
               last_modified_by   = %s,
               last_modified_date = NOW()
         WHERE entity_type = 'employees'
           AND deleted_flag = false
           AND (field_group IS NULL OR field_group = '')
        """,
        (order, SYS),
    )
    bucketed = cur.rowcount

    conn.commit()
    cur.close()
    conn.close()

    print(f"Soft-deleted {deleted} duplicate fields.")
    print(f"Grouped + reordered {updated} fields.")
    print(f"Pushed {bucketed} extra fields into 'Other'.")
    if not_found:
        print(f"Not found (already missing): {', '.join(not_found)}")


if __name__ == "__main__":
    main()
