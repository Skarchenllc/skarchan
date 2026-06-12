-- Seed the four new admin entities as sub-branches of administration,
-- plus their default field definitions. Idempotent.

DO $$
DECLARE
  admin_id uuid := 'f639e4cf-e331-43e0-a045-769eb4ca916f';
  sys_user uuid := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Branches (custom_modules)
  INSERT INTO custom_modules
    (id, module_code, module_name, module_label, description, icon, color,
     organization_id, is_system_module, is_active, parent_id, depth, display_order,
     show_in_navigation, settings, created_by, created_at, last_modified_by, last_modified_at)
  VALUES
    (gen_random_uuid(), 'risks',              'Risks',              'Risk Register',
     'Identified risks with likelihood, impact, and mitigation', 'AlertTriangle', '#DC2626',
     '00000000-0000-0000-0000-000000000000', false, true, admin_id, 1, 6, true, '{}'::json,
     sys_user, NOW(), sys_user, NOW()),
    (gen_random_uuid(), 'licenses',           'Licenses',           'Licenses & Permits',
     'Business operating licenses, regulatory certs, and permits', 'BadgeCheck', '#16A34A',
     '00000000-0000-0000-0000-000000000000', false, true, admin_id, 1, 7, true, '{}'::json,
     sys_user, NOW(), sys_user, NOW()),
    (gen_random_uuid(), 'board_meetings',     'Board Meetings',     'Board Meetings & Minutes',
     'Governance meeting records: agenda, attendees, decisions', 'Users', '#7C3AED',
     '00000000-0000-0000-0000-000000000000', false, true, admin_id, 1, 8, true, '{}'::json,
     sys_user, NOW(), sys_user, NOW()),
    (gen_random_uuid(), 'insurance_policies', 'Insurance Policies', 'Insurance Policies',
     'Organization-wide insurance coverage with policy and renewal tracking', 'Shield', '#0EA5E9',
     '00000000-0000-0000-0000-000000000000', false, true, admin_id, 1, 9, true, '{}'::json,
     sys_user, NOW(), sys_user, NOW())
  ON CONFLICT (module_code) DO NOTHING;
END $$;

-- Field definitions
DO $$
DECLARE
  sys_user uuid := '00000000-0000-0000-0000-000000000001';
  fld jsonb;
  fields jsonb := '[    {"e":"risks","n":"title",        "l":"Title",           "t":"text",     "r":true,  "o":1, "g":"Identity"},
    {"e":"risks","n":"category",     "l":"Category",        "t":"picklist", "r":true,  "o":2, "g":"Identity",
      "p":["Operational","Strategic","Financial","Compliance / Legal","IT / Cyber","Reputational","People","Environmental","Other"]},
    {"e":"risks","n":"description",  "l":"Description",     "t":"textarea", "r":false, "o":3, "g":"Identity"},
    {"e":"risks","n":"likelihood",   "l":"Likelihood",      "t":"picklist", "r":true,  "o":4, "g":"Assessment",
      "p":["Rare","Unlikely","Possible","Likely","Almost Certain"]},
    {"e":"risks","n":"impact",       "l":"Impact",          "t":"picklist", "r":true,  "o":5, "g":"Assessment",
      "p":["Insignificant","Minor","Moderate","Major","Catastrophic"]},
    {"e":"risks","n":"owner",        "l":"Owner",           "t":"text",     "r":false, "o":6, "g":"Assessment"},
    {"e":"risks","n":"mitigation",   "l":"Mitigation Plan", "t":"textarea", "r":false, "o":7, "g":"Response"},
    {"e":"risks","n":"status",       "l":"Status",          "t":"picklist", "r":true,  "o":8, "g":"Response",
      "p":["Open","Mitigated","Accepted","Transferred","Closed"]},
    {"e":"risks","n":"due_date",     "l":"Next Review",     "t":"date",     "r":false, "o":9, "g":"Response"},
    {"e":"risks","n":"notes",        "l":"Notes",           "t":"textarea", "r":false, "o":10,"g":"Response"},    {"e":"licenses","n":"name",              "l":"Name",              "t":"text",     "r":true,  "o":1, "g":"Identity"},
    {"e":"licenses","n":"license_number",    "l":"License Number",    "t":"text",     "r":false, "o":2, "g":"Identity"},
    {"e":"licenses","n":"license_type",      "l":"Type",              "t":"picklist", "r":false, "o":3, "g":"Identity",
      "p":["Business","Professional","Regulatory","Health & Safety","Environmental","Tax","Trade","Other"]},
    {"e":"licenses","n":"issuing_authority", "l":"Issuing Authority", "t":"text",     "r":false, "o":4, "g":"Identity"},
    {"e":"licenses","n":"issue_date",        "l":"Issued",            "t":"date",     "r":false, "o":5, "g":"Lifecycle"},
    {"e":"licenses","n":"expires_at",        "l":"Expires",           "t":"date",     "r":false, "o":6, "g":"Lifecycle"},
    {"e":"licenses","n":"renewal_required",  "l":"Renewal Required",  "t":"boolean",  "r":false, "o":7, "g":"Lifecycle"},
    {"e":"licenses","n":"file",              "l":"License File",      "t":"file",     "r":false, "o":8, "g":"Storage"},
    {"e":"licenses","n":"status",            "l":"Status",            "t":"picklist", "r":false, "o":9, "g":"Lifecycle",
      "p":["Active","Pending","Expired","Suspended","Revoked"]},
    {"e":"licenses","n":"notes",             "l":"Notes",             "t":"textarea", "r":false, "o":10,"g":"General"},    {"e":"board_meetings","n":"title",             "l":"Title",            "t":"text",     "r":true,  "o":1, "g":"Identity"},
    {"e":"board_meetings","n":"meeting_date",      "l":"Meeting Date",     "t":"date",     "r":true,  "o":2, "g":"Identity"},
    {"e":"board_meetings","n":"meeting_type",      "l":"Type",             "t":"picklist", "r":false, "o":3, "g":"Identity",
      "p":["Regular Board","Annual General","Special","Committee","Subcommittee","Other"]},
    {"e":"board_meetings","n":"location",          "l":"Location",         "t":"text",     "r":false, "o":4, "g":"Identity"},
    {"e":"board_meetings","n":"attendees",         "l":"Attendees",        "t":"textarea", "r":false, "o":5, "g":"Content"},
    {"e":"board_meetings","n":"agenda",            "l":"Agenda",           "t":"textarea", "r":false, "o":6, "g":"Content"},
    {"e":"board_meetings","n":"decisions",         "l":"Decisions / Resolutions", "t":"textarea", "r":false, "o":7, "g":"Content"},
    {"e":"board_meetings","n":"minutes_file",      "l":"Minutes File",     "t":"file",     "r":false, "o":8, "g":"Storage"},
    {"e":"board_meetings","n":"due_date",          "l":"Next Meeting",     "t":"date",     "r":false, "o":9, "g":"Followup"},
    {"e":"board_meetings","n":"notes",             "l":"Notes",            "t":"textarea", "r":false, "o":10,"g":"Followup"},    {"e":"insurance_policies","n":"policy_name",      "l":"Policy Name",      "t":"text",     "r":true,  "o":1, "g":"Identity"},
    {"e":"insurance_policies","n":"policy_number",    "l":"Policy Number",    "t":"text",     "r":false, "o":2, "g":"Identity"},
    {"e":"insurance_policies","n":"carrier",          "l":"Carrier",          "t":"text",     "r":false, "o":3, "g":"Identity"},
    {"e":"insurance_policies","n":"coverage_type",    "l":"Coverage Type",    "t":"picklist", "r":false, "o":4, "g":"Identity",
      "p":["General Liability","Professional Liability","Directors & Officers","Cyber","Property","Workers Compensation","Auto","Health","Umbrella","Other"]},
    {"e":"insurance_policies","n":"coverage_amount", "l":"Coverage Amount",   "t":"currency", "r":false, "o":5, "g":"Financial"},
    {"e":"insurance_policies","n":"premium",          "l":"Premium",          "t":"currency", "r":false, "o":6, "g":"Financial"},
    {"e":"insurance_policies","n":"start_date",       "l":"Start Date",       "t":"date",     "r":false, "o":7, "g":"Lifecycle"},
    {"e":"insurance_policies","n":"end_date",         "l":"End Date",         "t":"date",     "r":false, "o":8, "g":"Lifecycle"},
    {"e":"insurance_policies","n":"renewal_date",     "l":"Renewal Date",     "t":"date",     "r":false, "o":9, "g":"Lifecycle"},
    {"e":"insurance_policies","n":"broker",           "l":"Broker / Agent",   "t":"text",     "r":false, "o":10,"g":"Contact"},
    {"e":"insurance_policies","n":"file",             "l":"Policy File",      "t":"file",     "r":false, "o":11,"g":"Storage"},
    {"e":"insurance_policies","n":"status",           "l":"Status",           "t":"picklist", "r":false, "o":12,"g":"Lifecycle",
      "p":["Active","Expired","Cancelled","Pending Renewal"]},
    {"e":"insurance_policies","n":"notes",            "l":"Notes",            "t":"textarea", "r":false, "o":13,"g":"General"}
  ]'::jsonb;
BEGIN
  FOR fld IN SELECT * FROM jsonb_array_elements(fields) LOOP
    INSERT INTO custom_field_definitions
      (field_name, field_label, field_type, entity_type, is_required,
       picklist_values, display_order, is_visible, field_group,
       created_by, last_modified_by)
    VALUES (
      fld->>'n',
      fld->>'l',
      fld->>'t',
      fld->>'e',
      (fld->>'r')::boolean,
      CASE WHEN fld ? 'p' THEN fld->'p' ELSE NULL END,
      (fld->>'o')::int,
      true,
      fld->>'g',
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001'
    )
    ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING;
  END LOOP;
END $$;

SELECT entity_type, COUNT(*) FROM custom_field_definitions
WHERE entity_type IN ('risks','licenses','board_meetings','insurance_policies')
  AND deleted_flag = false
GROUP BY entity_type ORDER BY entity_type;
