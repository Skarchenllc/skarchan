-- Assign a specialist to every Customer Service section + enable each section.
WITH cs(et, label) AS (
  VALUES
    ('support_tickets',  'Support Tickets'),
    ('service_requests', 'Service Requests'),
    ('knowledge_base',   'Knowledge Base'),
    ('customer_feedback','Customer Feedback'),
    ('sla_agreements',   'SLA Agreements')
)
-- 1) Hire a specialist per section (idempotent).
INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, created_by, last_modified_by, is_deleted, created_at, last_modified_at)
SELECT gen_random_uuid(), 'ai_workers', 'core',
  jsonb_build_object('module_code','customer-service','entity_type',et,
    'name', label || ' Specialist', 'role', lower(label) || ' specialist',
    'persona', 'Specialist for the ' || label || ' section in Customer Service. Customer-focused, resolves issues quickly, and flags anything that risks satisfaction or SLAs.',
    'autonomy','review','capabilities',jsonb_build_array(),'kpis',jsonb_build_array(),'enabled',true),
  '00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','N',now(),now()
FROM cs
WHERE NOT EXISTS (
  SELECT 1 FROM entity_records w WHERE w.entity_type='ai_workers' AND w.is_deleted='N'
    AND w.data->>'module_code'='customer-service' AND w.data->>'entity_type'=cs.et
);

-- 2a) Enable AI for sections that already have a settings row.
UPDATE entity_records
SET data = data || '{"enabled":true}'::jsonb, last_modified_at = now()
WHERE entity_type='ai_settings' AND is_deleted='N'
  AND data->>'module_code'='customer-service'
  AND data->>'entity_type' IN ('support_tickets','service_requests','knowledge_base','customer_feedback','sla_agreements');

-- 2b) Create an enabled settings row for sections that have none.
WITH cs(et) AS (
  VALUES ('support_tickets'),('service_requests'),('knowledge_base'),('customer_feedback'),('sla_agreements')
)
INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, created_by, last_modified_by, is_deleted, created_at, last_modified_at)
SELECT gen_random_uuid(), 'ai_settings', 'core',
  jsonb_build_object('module_code','customer-service','entity_type',et,'enabled',true,'model_tier',null,'capabilities',jsonb_build_object()),
  '00000000-0000-0000-0000-000000000000','00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','N',now(),now()
FROM cs
WHERE NOT EXISTS (
  SELECT 1 FROM entity_records s WHERE s.entity_type='ai_settings' AND s.is_deleted='N'
    AND s.data->>'module_code'='customer-service' AND s.data->>'entity_type'=cs.et
);
