# Administration Frontend Module

A comprehensive Next.js 14 application for managing executive board, legal cases, compliance policies, audits, and strategic initiatives.

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Design**: Minimal BLACK text with BLUE (#2563EB) accents only

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                              ✅ Dashboard with stats
│   │   ├── layout.tsx                            ✅ Root layout with navigation
│   │   ├── globals.css                           ✅ Tailwind styles
│   │   ├── executive-board/
│   │   │   ├── page.tsx                          ✅ List view (grid cards)
│   │   │   ├── new/page.tsx                      ✅ Create form
│   │   │   └── [id]/page.tsx                     ✅ Detail view
│   │   ├── legal-cases/
│   │   │   ├── page.tsx                          ✅ List view (table + filters)
│   │   │   ├── new/page.tsx                      ✅ Create form
│   │   │   └── [id]/page.tsx                     ✅ Detail view
│   │   ├── compliance-policies/
│   │   │   ├── page.tsx                          ✅ List view (table + filters)
│   │   │   ├── new/page.tsx                      ⏳ NEEDED - Use template
│   │   │   └── [id]/page.tsx                     ⏳ NEEDED - Use template
│   │   ├── compliance-audits/
│   │   │   ├── page.tsx                          ⏳ NEEDED - Use template
│   │   │   ├── new/page.tsx                      ⏳ NEEDED - Use template
│   │   │   └── [id]/page.tsx                     ⏳ NEEDED - Use template
│   │   └── strategic-initiatives/
│   │       ├── page.tsx                          ⏳ NEEDED - Use template
│   │       ├── new/page.tsx                      ⏳ NEEDED - Use template
│   │       └── [id]/page.tsx                     ⏳ NEEDED - Use template
│   ├── components/
│   │   ├── Navigation.tsx                        ✅ Main navigation
│   │   ├── LoadingSpinner.tsx                    ✅ Loading indicator
│   │   └── StatCard.tsx                          ✅ Dashboard cards
│   └── lib/
│       ├── api.ts                                ✅ API utilities
│       └── types.ts                              ✅ TypeScript interfaces
├── package.json                                  ✅ Dependencies (port 3008)
├── tsconfig.json                                 ✅ TypeScript config
├── tailwind.config.js                            ✅ Tailwind config
├── next.config.js                                ✅ API rewrites to /api/v1
├── Dockerfile.dev                                ✅ Docker config
├── .env.local                                    ✅ Environment variables
├── IMPLEMENTATION_STATUS.md                      ✅ Progress tracking
├── REMAINING_PAGES_TEMPLATE.md                   ✅ Templates for remaining pages
└── README.md                                     ✅ This file
```

## Configuration

### Environment Variables (.env.local)
```env
NEXT_PUBLIC_API_URL=http://administration-backend:8000
ADMINISTRATION_BACKEND_URL=http://administration-backend:8000
```

### Ports
- **Internal**: 3008
- **External**: 3108 (configured in docker-compose)

### API Integration
All API calls are rewritten from `/api/v1/*` to the backend service via `next.config.js`.

## Design Guidelines

### Color Palette (STRICT)
- **Primary Text**: BLACK (#000000)
- **Links/Buttons**: BLUE (#2563EB)
- **Secondary Text**: Gray shades (#6B7280, #9CA3AF, #D1D5DB)
- **Borders**: Gray (#E5E7EB, #D1D5DB)
- **Backgrounds**: White (#FFFFFF), Light Gray (#F9FAFB)

### Status Badge Colors (Only for Status Indicators)
- Active/Completed: Green
- In Progress/Under Review: Yellow
- Inactive/Draft: Gray
- Cancelled/Archived: Red
- High Priority/Critical: Orange/Red

### Typography
- **Headings**: Bold, Black color
- **Body**: Regular, Black color
- **Secondary**: Regular, Gray color

## API Data Extraction Pattern

**CRITICAL**: All API responses are wrapped in objects. Always extract data:

```typescript
// List endpoints
const data = await api.moduleName.list();
const items = extractArray<TypeName>(data, 'api_response_key');

// Detail endpoints
const data = await api.moduleName.get(id);
const item = extractObject<TypeName>(data, 'api_response_key');
```

### API Response Keys
- Executive Board: `executive_board`
- Legal Cases: `legal_cases`
- Compliance Policies: `compliance_policies`
- Compliance Audits: `compliance_audits`
- Strategic Initiatives: `strategic_initiatives`

## TypeScript Interfaces

All interfaces are defined in `/src/lib/types.ts` matching backend models EXACTLY:

- `ExecutiveBoard` - Board member with position, department, status
- `LegalCase` - Case with number, type, status, priority
- `CompliancePolicy` - Policy with code, name, category, version
- `ComplianceAudit` - Audit with number, type, risk level, score
- `StrategicInitiative` - Initiative with name, status, priority, progress

### Important Field Names (Use Exactly)
- `member_name` (not `name`)
- `case_number` (not `caseNumber`)
- `policy_code` (not `policyCode`)
- `audit_number` (not `auditNumber`)
- `initiative_name` (not `initiativeName`)

## Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Access at: http://localhost:3008

### Build for Production
```bash
npm run build
npm start
```

### Docker Development
```bash
docker build -f Dockerfile.dev -t administration-frontend .
docker run -p 3008:3008 administration-frontend
```

## Completing Remaining Pages

### Files Still Needed (7 pages)

1. **Compliance Policies Detail & New**
   - `/src/app/compliance-policies/[id]/page.tsx`
   - `/src/app/compliance-policies/new/page.tsx`

2. **Compliance Audits (All 3)**
   - `/src/app/compliance-audits/page.tsx`
   - `/src/app/compliance-audits/[id]/page.tsx`
   - `/src/app/compliance-audits/new/page.tsx`

3. **Strategic Initiatives (All 3)**
   - `/src/app/strategic-initiatives/page.tsx`
   - `/src/app/strategic-initiatives/[id]/page.tsx`
   - `/src/app/strategic-initiatives/new/page.tsx`

### Copy Patterns From

**For List Pages** (with tables and filters):
- Copy from: `/src/app/legal-cases/page.tsx`
- Copy from: `/src/app/compliance-policies/page.tsx`

**For Detail Pages**:
- Copy from: `/src/app/legal-cases/[id]/page.tsx`
- Copy from: `/src/app/executive-board/[id]/page.tsx`

**For New/Create Pages**:
- Copy from: `/src/app/legal-cases/new/page.tsx`
- Copy from: `/src/app/executive-board/new/page.tsx`

### Quick Implementation Steps

1. **Copy an existing page** that matches the pattern
2. **Update imports** - Change the type import
3. **Update API calls** - Change `api.oldModule` to `api.newModule`
4. **Update extraction key** - Change `'old_key'` to `'new_key'`
5. **Update form fields** - Add/remove fields based on the interface
6. **Update filters** - Adjust filter options for the module
7. **Update links** - Change `/old-path/` to `/new-path/`

### Example: Creating Compliance Audits List Page

```typescript
// 1. Copy compliance-policies/page.tsx
// 2. Change imports
import type { ComplianceAudit } from '@/lib/types';

// 3. Change API call
const data = await api.complianceAudits.list();
const items = extractArray<ComplianceAudit>(data, 'compliance_audits');

// 4. Update filters for audits (status, audit_type, risk_level)
// 5. Update table columns (audit_number, title, audit_type, etc.)
// 6. Update all links to /compliance-audits/
```

## API Endpoints

All endpoints are available via the `api` object in `/src/lib/api.ts`:

```typescript
api.executiveBoard.{list, get, create, update, delete}
api.legalCases.{list, get, create, update, delete}
api.compliancePolicies.{list, get, create, update, delete}
api.complianceAudits.{list, get, create, update, delete}
api.strategicInitiatives.{list, get, create, update, delete}
```

## Common Issues & Solutions

### Issue: Empty data returned
**Solution**: Check that you're using `extractArray()` or `extractObject()` with the correct key.

### Issue: TypeScript errors
**Solution**: Ensure field names match the interfaces in `types.ts` exactly.

### Issue: API not connecting
**Solution**: Verify backend is running and `NEXT_PUBLIC_API_URL` is correct.

### Issue: Filters not working
**Solution**: Check filter state and ensure the filter logic matches the field names.

## Component Patterns

### List Page Structure
```tsx
- Header with title and "New" button
- Filters section (optional)
- Empty state or data table/grid
- Each item links to detail page
```

### Detail Page Structure
```tsx
- Back link to list
- Title and actions (delete button)
- Data grid showing all fields
- Timestamps footer
```

### New Page Structure
```tsx
- Back link to list
- Form with all fields
- Required fields marked with *
- Submit and Cancel buttons
```

## Testing Checklist

- [ ] Dashboard loads and shows correct stats
- [ ] Navigation works for all sections
- [ ] List pages display data correctly
- [ ] Filters work on list pages
- [ ] Detail pages show all information
- [ ] Create forms submit successfully
- [ ] Delete functionality works
- [ ] Error states handled gracefully
- [ ] Loading states display properly
- [ ] Responsive design works on mobile

## Production Deployment

1. Ensure all environment variables are set
2. Run `npm run build` to create production build
3. Use `npm start` or deploy to containerized environment
4. Configure reverse proxy to handle external port (3108 → 3008)

## Support & Documentation

- **Backend API Docs**: Check backend README for API specifications
- **Type Definitions**: See `/src/lib/types.ts` for all data models
- **Template Guide**: See `REMAINING_PAGES_TEMPLATE.md` for page patterns
- **Implementation Status**: See `IMPLEMENTATION_STATUS.md` for progress

## Next Steps

1. Complete the 7 remaining page files using the templates
2. Test each module thoroughly
3. Adjust styling if needed (maintaining black + blue palette)
4. Add any custom features requested
5. Deploy to production environment

---

**Version**: 1.0.0
**Last Updated**: 2026-04-17
**Status**: Core functionality complete, 7 pages remaining
