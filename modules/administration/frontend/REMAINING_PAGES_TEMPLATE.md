# Template for Remaining Pages

All remaining pages follow identical patterns. Here are the templates:

## Compliance Policies - List Page Pattern
- Use table layout similar to Legal Cases
- Filters: category (data_privacy, financial, operational, ethical, safety, environmental, other), status (draft, active, under_review, archived)
- Display: policy_code, policy_name, category, version, status, effective_date
- Extract using: `extractArray<CompliancePolicy>(data, 'compliance_policies')`

## Compliance Policies - Detail Page Pattern
- Display all fields from CompliancePolicy interface
- Special fields: document_url (as link), scope, compliance_requirements
- Extract using: `extractObject<CompliancePolicy>(data, 'compliance_policies')`

## Compliance Policies - New Page Pattern
- Required fields: policy_code, policy_name, category, version, status
- Optional fields: description, effective_date, review_date, owner_department, document_url, scope, compliance_requirements
- Categories: data_privacy, financial, operational, ethical, safety, environmental, other
- Statuses: draft, active, under_review, archived

## Compliance Audits - List Page Pattern
- Use table layout
- Filters: status (scheduled, in_progress, completed, deferred), audit_type (internal, external, regulatory, follow_up), risk_level (low, medium, high, critical)
- Display: audit_number, title, audit_type, status, risk_level, score, audit_date
- Extract using: `extractArray<ComplianceAudit>(data, 'compliance_audits')`
- IMPORTANT: Can optionally display related policy name if policy relationship is included

## Compliance Audits - Detail Page Pattern
- Display all fields including findings, recommendations, action_items
- Show related policy information if available
- Special display: score (as percentage or number), follow_up_date
- Extract using: `extractObject<ComplianceAudit>(data, 'compliance_audits')`

## Compliance Audits - New Page Pattern
- Required fields: audit_number, title, audit_type, status, risk_level
- Optional fields: policy_id (dropdown of policies), auditor_name, audit_date, score, findings, recommendations, action_items, follow_up_date, notes
- IMPORTANT: Add policy selector that fetches from compliance-policies endpoint
- Audit types: internal, external, regulatory, follow_up
- Statuses: scheduled, in_progress, completed, deferred
- Risk levels: low, medium, high, critical

## Strategic Initiatives - List Page Pattern
- Use card/table hybrid layout (cards recommended for visual appeal)
- Filters: status (planning, in_progress, on_hold, completed, cancelled), priority (low, medium, high, critical), category (growth, efficiency, innovation, transformation, market_expansion, other)
- Display: initiative_name, category, status, priority, progress_percentage (as progress bar), budget vs actual_spend
- Extract using: `extractArray<StrategicInitiative>(data, 'strategic_initiatives')`

## Strategic Initiatives - Detail Page Pattern
- Display all fields in organized sections:
  - Basic Info: initiative_name, category, status, priority
  - Timeline: start_date, target_completion_date, actual_completion_date
  - Financial: budget, actual_spend (with comparison)
  - Progress: progress_percentage (visual bar)
  - Details: objectives, kpis, milestones, risks, dependencies
  - People: owner, stakeholders
- Extract using: `extractObject<StrategicInitiative>(data, 'strategic_initiatives')`

## Strategic Initiatives - New Page Pattern
- Required fields: initiative_name, category, status, priority
- Optional fields: description, objectives, start_date, target_completion_date, actual_completion_date, budget, actual_spend, progress_percentage, owner, stakeholders, kpis, milestones, risks, dependencies, notes
- Categories: growth, efficiency, innovation, transformation, market_expansion, other
- Statuses: planning, in_progress, on_hold, completed, cancelled
- Priorities: low, medium, high, critical
- Special inputs: progress_percentage (number 0-100), budget/actual_spend (number with currency)

## Status Badge Colors (Consistent Across All Modules)
```typescript
// Use these color mappings for consistency
const statusColors = {
  // General status colors
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-orange-100 text-orange-800',

  // Priority colors
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',

  // Risk level colors (same as priority)
  // ...same as priority
};
```

## Form Input Classes (Consistent)
```typescript
const inputClasses = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";
const labelClasses = "block text-sm font-medium text-black";
const buttonPrimaryClasses = "px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50";
const buttonSecondaryClasses = "px-6 py-2 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors";
```

## API Call Pattern (Copy This Exactly)
```typescript
// List page
const data = await api.moduleName.list();
const items = extractArray<TypeName>(data, 'api_key_name');

// Detail page
const data = await api.moduleName.get(id);
const item = extractObject<TypeName>(data, 'api_key_name');

// Create
await api.moduleName.create(cleanedData);

// Delete
await api.moduleName.delete(id);
```

## Copy these exact patterns from existing files:
1. Executive Board pages for card layouts and forms
2. Legal Cases pages for table layouts with filters
3. All use same navigation, loading spinner, error handling patterns
