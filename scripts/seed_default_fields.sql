-- Seeds default field definitions for entities that have zero fields.
-- Idempotent thanks to ON CONFLICT.

DO $$
DECLARE
  sys_user uuid := '00000000-0000-0000-0000-000000000001';
  fld jsonb;
  fields jsonb := '[
    {"entity":"products","name":"name","label":"Name","type":"text","req":true,"order":1,"group":"General"},
    {"entity":"products","name":"sku","label":"SKU","type":"text","req":true,"order":2,"group":"General"},
    {"entity":"products","name":"description","label":"Description","type":"textarea","req":false,"order":3,"group":"General"},
    {"entity":"products","name":"price","label":"Price","type":"currency","req":true,"order":4,"group":"Pricing"},
    {"entity":"products","name":"stock","label":"Stock","type":"number","req":false,"order":5,"group":"Inventory"},
    {"entity":"products","name":"category","label":"Category","type":"picklist","req":false,"order":6,"group":"General","picklist":["Physical","Digital","Service"]},
    {"entity":"products","name":"is_active","label":"Active","type":"boolean","req":false,"order":7,"group":"General"},

    {"entity":"orders","name":"order_number","label":"Order #","type":"text","req":true,"order":1,"group":"General"},
    {"entity":"orders","name":"customer_name","label":"Customer","type":"text","req":true,"order":2,"group":"General"},
    {"entity":"orders","name":"total","label":"Total","type":"currency","req":true,"order":3,"group":"Pricing"},
    {"entity":"orders","name":"status","label":"Status","type":"picklist","req":true,"order":4,"group":"General","picklist":["Pending","Paid","Shipped","Cancelled","Refunded"]},
    {"entity":"orders","name":"order_date","label":"Order Date","type":"date","req":true,"order":5,"group":"General"},
    {"entity":"orders","name":"notes","label":"Notes","type":"textarea","req":false,"order":6,"group":"General"},

    {"entity":"pos_sessions","name":"session_code","label":"Session Code","type":"text","req":true,"order":1,"group":"General"},
    {"entity":"pos_sessions","name":"cashier","label":"Cashier","type":"text","req":true,"order":2,"group":"General"},
    {"entity":"pos_sessions","name":"opening_balance","label":"Opening Balance","type":"currency","req":true,"order":3,"group":"Cash"},
    {"entity":"pos_sessions","name":"closing_balance","label":"Closing Balance","type":"currency","req":false,"order":4,"group":"Cash"},
    {"entity":"pos_sessions","name":"opened_at","label":"Opened At","type":"datetime","req":true,"order":5,"group":"Timing"},
    {"entity":"pos_sessions","name":"closed_at","label":"Closed At","type":"datetime","req":false,"order":6,"group":"Timing"},
    {"entity":"pos_sessions","name":"status","label":"Status","type":"picklist","req":true,"order":7,"group":"General","picklist":["Open","Closed"]},

    {"entity":"storefronts","name":"name","label":"Name","type":"text","req":true,"order":1,"group":"General"},
    {"entity":"storefronts","name":"url","label":"URL","type":"url","req":false,"order":2,"group":"General"},
    {"entity":"storefronts","name":"description","label":"Description","type":"textarea","req":false,"order":3,"group":"General"},
    {"entity":"storefronts","name":"currency","label":"Currency","type":"text","req":false,"order":4,"group":"Settings"},
    {"entity":"storefronts","name":"is_active","label":"Active","type":"boolean","req":true,"order":5,"group":"General"},

    {"entity":"assets","name":"asset_tag","label":"Asset Tag","type":"text","req":true,"order":1,"group":"Identity"},
    {"entity":"assets","name":"name","label":"Name","type":"text","req":true,"order":2,"group":"Identity"},
    {"entity":"assets","name":"category","label":"Category","type":"picklist","req":true,"order":3,"group":"Identity","picklist":["Equipment","Vehicle","IT Hardware","Furniture","Other"]},
    {"entity":"assets","name":"value","label":"Value","type":"currency","req":false,"order":4,"group":"Financial"},
    {"entity":"assets","name":"purchase_date","label":"Purchase Date","type":"date","req":false,"order":5,"group":"Financial"},
    {"entity":"assets","name":"location","label":"Location","type":"text","req":false,"order":6,"group":"Tracking"},
    {"entity":"assets","name":"status","label":"Status","type":"picklist","req":true,"order":7,"group":"Tracking","picklist":["Active","In Maintenance","Retired","Disposed"]},
    {"entity":"assets","name":"notes","label":"Notes","type":"textarea","req":false,"order":8,"group":"General"},

    {"entity":"contracts","name":"contract_number","label":"Contract #","type":"text","req":true,"order":1,"group":"Identity"},
    {"entity":"contracts","name":"title","label":"Title","type":"text","req":true,"order":2,"group":"Identity"},
    {"entity":"contracts","name":"party","label":"Counterparty","type":"text","req":true,"order":3,"group":"Identity"},
    {"entity":"contracts","name":"value","label":"Value","type":"currency","req":false,"order":4,"group":"Financial"},
    {"entity":"contracts","name":"start_date","label":"Start Date","type":"date","req":true,"order":5,"group":"Term"},
    {"entity":"contracts","name":"end_date","label":"End Date","type":"date","req":true,"order":6,"group":"Term"},
    {"entity":"contracts","name":"renewal_date","label":"Renewal Date","type":"date","req":false,"order":7,"group":"Term"},
    {"entity":"contracts","name":"status","label":"Status","type":"picklist","req":true,"order":8,"group":"Status","picklist":["Draft","Active","Expired","Terminated","Renewed"]},
    {"entity":"contracts","name":"notes","label":"Notes","type":"textarea","req":false,"order":9,"group":"General"},

    {"entity":"documents","name":"title","label":"Title","type":"text","req":true,"order":1,"group":"Identity"},
    {"entity":"documents","name":"category","label":"Category","type":"picklist","req":false,"order":2,"group":"Identity","picklist":["Policy","Contract","Report","Manual","Image","Other"]},
    {"entity":"documents","name":"description","label":"Description","type":"textarea","req":false,"order":3,"group":"General"},
    {"entity":"documents","name":"file_url","label":"File URL","type":"url","req":false,"order":4,"group":"Storage"},
    {"entity":"documents","name":"version","label":"Version","type":"text","req":false,"order":5,"group":"Storage"},
    {"entity":"documents","name":"uploaded_date","label":"Uploaded","type":"date","req":false,"order":6,"group":"Storage"},
    {"entity":"documents","name":"tags","label":"Tags","type":"text","req":false,"order":7,"group":"General"},

    {"entity":"subscriptions","name":"vendor","label":"Vendor","type":"text","req":true,"order":1,"group":"Identity"},
    {"entity":"subscriptions","name":"product_name","label":"Product","type":"text","req":true,"order":2,"group":"Identity"},
    {"entity":"subscriptions","name":"cost","label":"Cost","type":"currency","req":true,"order":3,"group":"Financial"},
    {"entity":"subscriptions","name":"billing_cycle","label":"Billing Cycle","type":"picklist","req":true,"order":4,"group":"Financial","picklist":["Monthly","Quarterly","Annual","One-time"]},
    {"entity":"subscriptions","name":"start_date","label":"Start Date","type":"date","req":true,"order":5,"group":"Term"},
    {"entity":"subscriptions","name":"renewal_date","label":"Renewal Date","type":"date","req":false,"order":6,"group":"Term"},
    {"entity":"subscriptions","name":"status","label":"Status","type":"picklist","req":true,"order":7,"group":"Status","picklist":["Active","Cancelled","Paused","Trial"]},
    {"entity":"subscriptions","name":"notes","label":"Notes","type":"textarea","req":false,"order":8,"group":"General"},

    {"entity":"credentials","name":"name","label":"Name","type":"text","req":true,"order":1,"group":"Identity"},
    {"entity":"credentials","name":"service","label":"Service","type":"text","req":true,"order":2,"group":"Identity"},
    {"entity":"credentials","name":"username","label":"Username","type":"text","req":false,"order":3,"group":"Auth"},
    {"entity":"credentials","name":"category","label":"Category","type":"picklist","req":true,"order":4,"group":"Identity","picklist":["API Key","Service Account","Database","SSH Key","Other"]},
    {"entity":"credentials","name":"expires_at","label":"Expires","type":"date","req":false,"order":5,"group":"Lifecycle"},
    {"entity":"credentials","name":"is_active","label":"Active","type":"boolean","req":true,"order":6,"group":"Lifecycle"},
    {"entity":"credentials","name":"notes","label":"Notes","type":"textarea","req":false,"order":7,"group":"General"}
  ]'::jsonb;
BEGIN
  FOR fld IN SELECT * FROM jsonb_array_elements(fields) LOOP
    INSERT INTO custom_field_definitions
      (field_name, field_label, field_type, entity_type, is_required,
       picklist_values, display_order, is_visible, field_group,
       created_by, last_modified_by)
    VALUES (
      fld->>'name',
      fld->>'label',
      fld->>'type',
      fld->>'entity',
      (fld->>'req')::boolean,
      fld->'picklist',
      (fld->>'order')::int,
      true,
      fld->>'group',
      sys_user,
      sys_user
    )
    ON CONFLICT (entity_type, field_name, deleted_flag) DO NOTHING;
  END LOOP;
END $$;

SELECT entity_type, COUNT(*) AS field_count
FROM custom_field_definitions
WHERE entity_type IN ('products','orders','pos_sessions','storefronts','assets','contracts','documents','subscriptions','credentials')
  AND deleted_flag = false
GROUP BY entity_type
ORDER BY entity_type;
