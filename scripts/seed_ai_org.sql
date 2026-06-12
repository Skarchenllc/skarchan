-- Seed a starter AI org (mirrors scripts/seed_ai_org.py). Idempotent: only
-- inserts a worker slot that doesn't already exist (active).
-- Leadership: CEO + 6 division heads + 8 unit managers.
WITH lead(mc, et, nm, rl, ps) AS (
  VALUES
    ('__org__','__ceo__','Casey Vance','CEO','Pragmatic and decisive. Focuses the company on its few highest-leverage priorities, protects cash and reputation, and escalates only what truly matters.'),
    ('front_office','__division__','Riley Hart','Front Office Head','Customer- and revenue-obsessed; aligns sales, marketing and service around the pipeline and the customer experience.'),
    ('finance','__division__','Dana Cole','Finance Head','Risk-averse and compliance-first; protects cash, watches the numbers, and flags anomalies early.'),
    ('supply_chain','__division__','Sam Okafor','Supply Chain Head','Reliability- and cost-focused; keeps inventory and procurement flowing without surprises.'),
    ('production','__division__','Pat Nguyen','Production Head','Quality- and throughput-driven; balances output with standards and safety.'),
    ('people','__division__','Jordan Ellis','People Head','People-first; protects talent, culture and compliance across the workforce.'),
    ('projects_governance','__division__','Morgan Reyes','Projects & Governance Head','Delivery- and governance-minded; keeps projects on track and the org compliant and well-run.'),
    ('sales','__manager__','Alex Stone','Sales Manager','Closes deals; prioritises the highest-value opportunities and keeps the pipeline moving.'),
    ('marketing','__manager__','Robin Park','Marketing Manager','Demand- and brand-focused; nurtures leads and measures what works.'),
    ('accounting','__manager__','Quinn Avery','Accounting Manager','Precise and controls-minded; keeps the books accurate and timely.'),
    ('inventory','__manager__','Drew Bauer','Inventory Manager','Keeps stock accurate and available; prevents shortages and dead stock.'),
    ('production','__manager__','Lee Maddox','Production Manager','Runs the floor; balances schedule, quality and cost.'),
    ('hr','__manager__','Taylor Brooks','HR Manager','Supports employees end to end — hiring, onboarding, and compliance.'),
    ('pm','__manager__','Cameron Webb','Project Manager','Drives projects to done; manages scope, milestones and owners.'),
    ('administration','__manager__','Avery Lloyd','Administration Manager','Keeps the org compliant and running — contracts, risk and governance.')
)
INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, created_by, last_modified_by, is_deleted, created_at, last_modified_at)
SELECT gen_random_uuid(), 'ai_workers', 'core',
  jsonb_build_object('module_code', mc, 'entity_type', et, 'name', nm, 'role', rl, 'persona', ps,
                     'autonomy', 'review', 'capabilities', jsonb_build_array(), 'kpis', jsonb_build_array(), 'enabled', true),
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'N', now(), now()
FROM lead
WHERE NOT EXISTS (
  SELECT 1 FROM entity_records w WHERE w.entity_type = 'ai_workers' AND w.is_deleted = 'N'
    AND w.data->>'module_code' = lead.mc AND w.data->>'entity_type' = lead.et
);

-- Section experts: one per AI-enabled section (the unit managers' teams).
WITH secs AS (
  SELECT DISTINCT data->>'module_code' AS mc, data->>'entity_type' AS et
  FROM entity_records
  WHERE entity_type = 'ai_settings' AND data->>'module_code' <> '__global__' AND (data->>'enabled') = 'true'
),
labelled AS (
  SELECT mc, et,
    initcap(replace(regexp_replace(et, '^' || mc || '_', ''), '_', ' ')) AS label
  FROM secs
)
INSERT INTO entity_records (id, entity_type, module_code, data, organization_id, created_by, last_modified_by, is_deleted, created_at, last_modified_at)
SELECT gen_random_uuid(), 'ai_workers', 'core',
  jsonb_build_object('module_code', mc, 'entity_type', et,
                     'name', label || ' Specialist', 'role', lower(label) || ' specialist',
                     'persona', 'Specialist for the ' || label || ' section in ' || mc || '. Knows this data deeply, surfaces issues early, and handles every change carefully.',
                     'autonomy', 'review', 'capabilities', jsonb_build_array(), 'kpis', jsonb_build_array(), 'enabled', true),
  '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'N', now(), now()
FROM labelled
WHERE NOT EXISTS (
  SELECT 1 FROM entity_records w WHERE w.entity_type = 'ai_workers' AND w.is_deleted = 'N'
    AND w.data->>'module_code' = labelled.mc AND w.data->>'entity_type' = labelled.et
);
