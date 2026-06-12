# Quick Completion Guide

This guide provides the exact steps to complete the remaining 8 pages in ~2-3 hours.

## Remaining Files (8 total)

1. `/src/app/compliance-policies/[id]/page.tsx` - Detail view
2. `/src/app/compliance-policies/new/page.tsx` - Create form
3. `/src/app/compliance-audits/page.tsx` - List view
4. `/src/app/compliance-audits/[id]/page.tsx` - Detail view
5. `/src/app/compliance-audits/new/page.tsx` - Create form
6. `/src/app/strategic-initiatives/[id]/page.tsx` - Detail view
7. `/src/app/strategic-initiatives/new/page.tsx` - Create form

## Copy-Paste Method (Fastest)

### File 1: Compliance Policies Detail Page

```bash
# Copy the legal cases detail page
cp "src/app/legal-cases/[id]/page.tsx" "src/app/compliance-policies/[id]/page.tsx"
```

Then replace in the file:
- `LegalCase` → `CompliancePolicy`
- `legalCase` → `policy`
- `legal-cases` → `compliance-policies` (in URLs)
- `api.legalCases` → `api.compliancePolicies`
- `'legal_cases'` → `'compliance_policies'`
- `case_number` → `policy_code`
- Update the displayed fields to match CompliancePolicy interface

### File 2: Compliance Policies New Page

```bash
# Copy the legal cases new page
cp "src/app/legal-cases/new/page.tsx" "src/app/compliance-policies/new/page.tsx"
```

Then replace in the file:
- `LegalCase` → `CompliancePolicy`
- `legal-cases` → `compliance-policies`
- `api.legalCases` → `api.compliancePolicies`
- Update form fields to:
  ```typescript
  formData = {
    policy_code: '',
    policy_name: '',
    category: 'data_privacy',
    description: '',
    version: '1.0',
    effective_date: '',
    review_date: '',
    owner_department: '',
    status: 'draft',
    document_url: '',
    scope: '',
    compliance_requirements: '',
  }
  ```
- Update category options: data_privacy, financial, operational, ethical, safety, environmental, other
- Update status options: draft, active, under_review, archived

### File 3: Compliance Audits List Page

```bash
# Copy the compliance policies list page
cp "src/app/compliance-policies/page.tsx" "src/app/compliance-audits/page.tsx"
```

Then replace:
- `CompliancePolicy` → `ComplianceAudit`
- `policies` → `audits`
- `compliance-policies` → `compliance-audits`
- `api.compliancePolicies` → `api.complianceAudits`
- `'compliance_policies'` → `'compliance_audits'`
- Update filters to: status, audit_type, risk_level
- Update table columns to: audit_number, title, audit_type, status, risk_level, score, audit_date

### File 4: Compliance Audits Detail Page

```bash
# Copy the legal cases detail page
cp "src/app/legal-cases/[id]/page.tsx" "src/app/compliance-audits/[id]/page.tsx"
```

Then replace:
- `LegalCase` → `ComplianceAudit`
- `legalCase` → `audit`
- `legal-cases` → `compliance-audits`
- `api.legalCases` → `api.complianceAudits`
- `'legal_cases'` → `'compliance_audits'`
- Update displayed fields to match ComplianceAudit interface

### File 5: Compliance Audits New Page

```bash
# Copy the legal cases new page
cp "src/app/legal-cases/new/page.tsx" "src/app/compliance-audits/new/page.tsx"
```

Then replace:
- `LegalCase` → `ComplianceAudit`
- `legal-cases` → `compliance-audits`
- `api.legalCases` → `api.complianceAudits`
- Update form fields to:
  ```typescript
  formData = {
    audit_number: '',
    title: '',
    audit_type: 'internal',
    policy_id: '',
    auditor_name: '',
    audit_date: '',
    status: 'scheduled',
    risk_level: 'medium',
    score: '',
    findings: '',
    recommendations: '',
    action_items: '',
    follow_up_date: '',
    notes: '',
  }
  ```
- Add policy selector (optional):
  ```tsx
  // Fetch policies on mount and create dropdown
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);

  useEffect(() => {
    async function fetchPolicies() {
      const data = await api.compliancePolicies.list();
      setPolicies(extractArray<CompliancePolicy>(data, 'compliance_policies'));
    }
    fetchPolicies();
  }, []);

  // In form:
  <select name="policy_id">
    <option value="">None</option>
    {policies.map(p => (
      <option key={p.id} value={p.id}>{p.policy_name}</option>
    ))}
  </select>
  ```

### File 6: Strategic Initiatives Detail Page

```bash
# Copy the legal cases detail page
cp "src/app/legal-cases/[id]/page.tsx" "src/app/strategic-initiatives/[id]/page.tsx"
```

Then replace:
- `LegalCase` → `StrategicInitiative`
- `legalCase` → `initiative`
- `legal-cases` → `strategic-initiatives`
- `api.legalCases` → `api.strategicInitiatives`
- `'legal_cases'` → `'strategic_initiatives'`
- Update displayed fields to match StrategicInitiative interface
- Add special displays:
  - Progress bar for `progress_percentage`
  - Budget vs Actual comparison
  - Format large text fields (objectives, kpis, milestones, risks)

### File 7: Strategic Initiatives New Page

```bash
# Copy the legal cases new page
cp "src/app/legal-cases/new/page.tsx" "src/app/strategic-initiatives/new/page.tsx"
```

Then replace:
- `LegalCase` → `StrategicInitiative`
- `legal-cases` → `strategic-initiatives`
- `api.legalCases` → `api.strategicInitiatives`
- Update form fields to:
  ```typescript
  formData = {
    initiative_name: '',
    category: 'growth',
    description: '',
    objectives: '',
    status: 'planning',
    priority: 'medium',
    start_date: '',
    target_completion_date: '',
    actual_completion_date: '',
    budget: '',
    actual_spend: '',
    progress_percentage: '',
    owner: '',
    stakeholders: '',
    kpis: '',
    milestones: '',
    risks: '',
    dependencies: '',
    notes: '',
  }
  ```
- Update category options: growth, efficiency, innovation, transformation, market_expansion, other
- Update status options: planning, in_progress, on_hold, completed, cancelled
- Add number inputs for budget, actual_spend, progress_percentage

## Find & Replace Checklist

For each copied file, make these replacements:

### Type Names
- [ ] Import statement updated
- [ ] State variable types updated
- [ ] Function parameters updated

### API Calls
- [ ] `api.oldModule` → `api.newModule`
- [ ] `'old_key'` → `'new_key'` in extractArray/extractObject

### URLs
- [ ] All `href="/old-path/` → `href="/new-path/`
- [ ] Back button link updated
- [ ] List page link updated

### Variable Names
- [ ] State variables renamed (e.g., `legalCase` → `policy`)
- [ ] Consistent naming throughout

### Form Fields
- [ ] formData object updated with correct fields
- [ ] All input names match interface fields
- [ ] Select options updated for enums
- [ ] Labels updated

### Display Fields
- [ ] All displayed fields match the new interface
- [ ] Field labels updated
- [ ] Status/priority colors appropriate

## Testing Each File

After creating each file:

1. **Check syntax**: `npm run type-check`
2. **Start dev server**: `npm run dev`
3. **Test in browser**:
   - List page loads
   - Can navigate to detail page
   - Can create new item
   - Delete works
   - Filters work (if applicable)

## Time Estimate

- File 1-2 (Compliance Policies): 20 minutes
- File 3-5 (Compliance Audits): 30 minutes
- File 6-7 (Strategic Initiatives): 20 minutes
- Testing: 20 minutes
- **Total: ~90 minutes**

## Common Issues & Solutions

### Issue: TypeScript errors
**Fix**: Check that all field names match the interface in `/src/lib/types.ts`

### Issue: API returns empty
**Fix**: Verify you're using the correct extraction key (e.g., `'compliance_audits'` not `'audits'`)

### Issue: Form doesn't submit
**Fix**: Check that required fields are marked as required in the form

### Issue: Filters don't work
**Fix**: Verify filter field names match the data field names exactly

## Verification Checklist

After completing all files:

- [ ] All TypeScript errors resolved
- [ ] All pages accessible via navigation
- [ ] Dashboard shows correct stats for all modules
- [ ] List pages display data correctly
- [ ] Detail pages show all information
- [ ] Create forms work and redirect properly
- [ ] Delete confirmations appear
- [ ] Filters work on all list pages
- [ ] Loading spinners appear during data fetch
- [ ] Empty states show when no data
- [ ] Mobile responsive layout works
- [ ] All links navigate correctly

## Final Steps

1. Run full test suite
2. Check browser console for errors
3. Test with actual backend data
4. Verify all CRUD operations
5. Check responsive design on mobile
6. Review code for consistency
7. Commit changes to git

---

**Estimated Completion Time**: 2-3 hours
**Difficulty**: Easy (following established patterns)
**Prerequisites**: Understanding of React, TypeScript, and Next.js basics
