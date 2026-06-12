# Recruitment to Employee Hub Integration Flow

## Overview
This document outlines the complete integration flow from Recruitment through to Employee Hub, making the Employee Profile the central hub for all HR data.

## Integration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RECRUITMENT PIPELINE                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  1. Job Requisition Posted                                             │
│     - Job details defined                                               │
│     - Hiring process phases configured                                  │
│     - Required documents specified                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  2. Applicants Apply                                                    │
│     - Submit resumes/CVs                                                │
│     - Fill application forms                                            │
│     - Provide personal information                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  3. Screening & Assessment                                              │
│     - Screening questions                                               │
│     - Skills assessments                                                │
│     - Background checks                                                 │
│     - Reference checks                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  4. Interview Process                                                   │
│     - Schedule interviews                                               │
│     - Collect feedback                                                  │
│     - Multiple rounds                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  5. Offer Management                                                    │
│     - Create offer letter                                               │
│     - Negotiate terms                                                   │
│     - Offer accepted                                                    │
│     - Status: "hired"                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ CONVERSION POINT: Convert Applicant to Employee                    │
│     - Click "Convert to Employee" button                                │
│     - System transfers applicant data to employee record                │
│     - Creates employee with status: "on_probation"                      │
│     - Triggers onboarding workflow                                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EMPLOYEE HUB - CENTRAL HUB                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Employee Profile Page (/employees/[id])                         │  │
│  │  - All employee data in one place                                │  │
│  │  - Single source of truth for all HR processes                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
      ┌──────────────┐    ┌─────────────────┐   ┌──────────────┐
      │  ONBOARDING  │    │   DEPARTMENTS   │   │ COMPENSATION │
      │              │    │                 │   │              │
      │ - Pre-board  │    │ - Assignment    │   │ - Salary     │
      │ - Day 1      │    │ - Team intro    │   │ - Benefits   │
      │ - Week 1     │    │ - Manager       │   │ - Payroll    │
      │ - Month 1-3  │    │                 │   │              │
      └──────────────┘    └─────────────────┘   └──────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
      ┌──────────────┐    ┌─────────────────┐   ┌──────────────┐
      │   TRAINING   │    │   PERFORMANCE   │   │  ATTENDANCE  │
      │              │    │                 │   │              │
      │ - Courses    │    │ - Reviews       │   │ - Records    │
      │ - Certs      │    │ - Goals         │   │ - Leave      │
      │ - Skills     │    │ - Feedback      │   │ - Time       │
      └──────────────┘    └─────────────────┘   └──────────────┘
                │                   │                   │
                └───────────────────┴───────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   ANALYTICS & REPORTS │
                        │                       │
                        │ - Employee metrics    │
                        │ - Performance trends  │
                        │ - Payroll summaries   │
                        │ - Leave analysis      │
                        └───────────────────────┘
```

## Data Flow

### 1. Applicant Data Structure
```typescript
interface Applicant {
  // Identification
  id: string;
  name: string;
  email: string;
  phone: string;

  // Job Application
  job_id: string;
  job_title: string;
  application_date: string;
  status: "new" | "screening" | "interview" | "offer" | "hired" | "rejected";

  // Documents
  resume_url?: string;
  cover_letter?: string;

  // Personal Info
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;

  // Professional
  experience_years: number;
  education?: string;
  skills?: string[];

  // Emergency Contact
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
}
```

### 2. Employee Data Structure (Extended)
```typescript
interface Employee {
  // Basic Info (from applicant)
  id: string;
  employee_code: string; // Generated: EMP-YYYY-NNNN
  first_name: string;
  middle_name?: string;
  last_name: string;

  // Contact (from applicant)
  work_email?: string;
  personal_email?: string;
  work_phone?: string;
  personal_phone?: string;

  // Employment
  employment_type: string; // from job requisition
  employment_status: string; // "on_probation" initially
  department_id?: string; // from job requisition
  job_title?: string; // from job requisition
  hire_date: string; // offer acceptance date or start date

  // Compensation (from offer)
  base_salary?: number;
  pay_frequency?: string;

  // Personal (from applicant)
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;

  // Emergency Contact (from applicant)
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;

  // NEW: Onboarding Fields
  onboarding_status?: "not_started" | "in_progress" | "completed";
  onboarding_progress?: number; // 0-100
  onboarding_start_date?: string;
  onboarding_completion_date?: string;
  probation_end_date?: string; // hire_date + 90 days typically

  // Source Tracking
  recruited_from?: "job_application" | "referral" | "direct_hire";
  job_requisition_id?: string; // Link back to recruitment
  applicant_id?: string; // Link back to applicant record
}
```

## Integration Points

### A. In Recruitment Module (`/recruitment/jobs/[id]/page.tsx`)

#### 1. Add "Convert to Employee" Button
- Location: Applicant detail modal or applicant card
- Condition: Only show when applicant status = "hired"
- Action: Opens conversion modal

#### 2. Conversion Modal
```typescript
interface ConversionModalProps {
  applicant: Applicant;
  jobRequisition: JobRequisition;
  onConvert: (employeeData: Partial<Employee>) => Promise<void>;
}
```

**Modal should collect:**
- Employee code (auto-generated or manual)
- Official start date
- Department assignment
- Manager assignment
- Salary details (if not in offer)
- Employment status (default: "on_probation")
- Probation period (default: 90 days)

#### 3. Conversion API Call
```typescript
POST /api/hr/employees/convert-from-applicant
{
  applicant_id: string;
  job_requisition_id: string;
  start_date: string;
  employee_code?: string; // Optional, auto-generated if not provided
  department_id: string;
  base_salary: number;
  pay_frequency: string;
  employment_type: string;
  probation_days: number; // default: 90
}

Response:
{
  employee_id: string;
  employee_code: string;
  onboarding_initiated: boolean;
}
```

### B. In Employee Hub (`/employees/[id]/page.tsx`)

#### 1. Add "Onboarding" Tab
- Position: After "Training" tab
- Icon: `<Rocket />` or `<UserCheck />`
- Only visible for employees with `employment_status = "on_probation"`

#### 2. Onboarding Tab Content
Uses the `OnboardingWorkflow` component:
```tsx
{activeTab === "onboarding" && (
  <div className="p-6">
    <OnboardingWorkflow
      employeeId={employee.id}
      employeeName={`${employee.first_name} ${employee.last_name}`}
      department={department?.name}
      jobTitle={employee.job_title}
      startDate={employee.hire_date}
      onComplete={() => {
        // Update employee status to "active"
        // Set onboarding_completion_date
        // Optionally end probation
      }}
    />
  </div>
)}
```

#### 3. Enhanced Employee Profile Header
Add onboarding badge when in probation:
```tsx
{employee.employment_status === "on_probation" && (
  <div className="flex items-center space-x-2">
    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full flex items-center">
      <Rocket className="w-3 h-3 mr-1" />
      Onboarding: {employee.onboarding_progress}%
    </span>
    <span className="text-xs text-gray-600">
      Probation ends: {employee.probation_end_date}
    </span>
  </div>
)}
```

### C. In Employee Directory (`/employees/page.tsx`)

#### 1. Add Onboarding Filter
```typescript
const [onboardingFilter, setOnboardingFilter] = useState("all");

// Filter options:
- "all": All employees
- "onboarding": Only employees in onboarding (status = on_probation)
- "completed": Only employees who completed onboarding
```

#### 2. Onboarding Status Column
In the employees table, add visual indicator:
```tsx
<td>
  {emp.onboarding_status === "in_progress" && (
    <div className="flex items-center">
      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${emp.onboarding_progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-600">
        {emp.onboarding_progress}%
      </span>
    </div>
  )}
</td>
```

## Department Integration

### When employee is assigned to department:
1. Employee appears in department's employee list
2. Department analytics include new employee
3. Manager is notified (if manager field exists)

### Department Page Updates:
- Show "New Hires" section
- Display employees in onboarding
- Link to employee profiles

## Training Integration

### Automatic Training Assignment:
1. When employee is created from applicant
2. System checks job requisition's `training_required` field
3. Automatically creates training assignments
4. Adds to onboarding checklist

### Training Tab in Employee Profile:
- Shows assigned courses
- Tracks completion
- Links to training modules

## Compensation Integration

### From Offer to Payroll:
1. Offer details (salary, benefits) transfer to employee record
2. Employee record links to compensation system
3. First payroll entry created
4. Benefits enrollment initiated in onboarding

### Compensation Tab Shows:
- Offer details
- Salary structure
- Benefits enrollment status
- YTD earnings (after first payroll)

## Performance Integration

### Probation Review Schedule:
1. When employee is converted, system schedules:
   - 30-day review
   - 60-day review
   - 90-day review (probation end)

2. Reviews appear in Performance tab
3. Manager receives reminders

## Analytics Integration

### Dashboard Updates:
- Total employees count increases
- "Employees in onboarding" metric
- "New hires this month" metric
- Onboarding completion rate

### Reports Include:
- Time to productivity (onboarding completion time)
- Retention rate by recruitment source
- Department growth tracking

## API Endpoints Needed

### 1. Convert Applicant
```
POST /api/hr/employees/convert-from-applicant
```

### 2. Get Onboarding Status
```
GET /api/hr/employees/{id}/onboarding
```

### 3. Update Onboarding Progress
```
PUT /api/hr/employees/{id}/onboarding
```

### 4. Complete Onboarding
```
POST /api/hr/employees/{id}/onboarding/complete
```

### 5. Link Employee to Applicant
```
GET /api/hr/employees/{id}/recruitment-history
```

## UI/UX Flow

### For HR Manager:
1. Review applications in Recruitment module
2. Conduct interviews and make offer
3. Once offer accepted, click "Convert to Employee"
4. Fill in additional details (start date, etc.)
5. Employee record created automatically
6. Onboarding workflow initiated
7. Navigate to Employee Hub to monitor onboarding
8. Track completion through dashboards

### For New Employee (Future: Employee Portal):
1. Receive welcome email with portal login
2. Access onboarding checklist
3. Complete required documents
4. View training assignments
5. Track probation progress
6. Access payslips and benefits info

## Benefits of This Integration

### 1. Single Source of Truth
- Employee profile contains ALL data
- No duplication across modules
- Consistent information everywhere

### 2. Streamlined Process
- One-click conversion from applicant to employee
- Automatic onboarding initiation
- Reduced manual data entry

### 3. Better Tracking
- Clear recruitment-to-employment pipeline
- Onboarding progress visibility
- Historical data linkage

### 4. Improved Experience
- HR: Less administrative work
- Managers: Clear view of new team members
- Employees: Guided onboarding process

### 5. Analytics & Insights
- Track effectiveness of recruitment sources
- Measure time to productivity
- Identify onboarding bottlenecks
- Calculate cost per hire

## Implementation Checklist

- [x] Create OnboardingWorkflow component
- [ ] Add onboarding fields to Employee interface
- [ ] Add Onboarding tab to employee profile
- [ ] Create "Convert to Employee" button in recruitment
- [ ] Create conversion modal
- [ ] Implement conversion API endpoint
- [ ] Update employee directory with onboarding filters
- [ ] Add onboarding progress indicators
- [ ] Link departments to employees
- [ ] Auto-assign training from job requisition
- [ ] Schedule probation reviews
- [ ] Update analytics dashboards
- [ ] Test end-to-end flow

## Future Enhancements

1. **Employee Self-Service Portal**
   - Employees can track own onboarding
   - Complete documents digitally
   - E-signatures for contracts

2. **Automated Workflows**
   - Trigger emails based on onboarding tasks
   - Auto-create IT tickets for equipment
   - Schedule orientation meetings automatically

3. **Advanced Analytics**
   - Predictive models for employee success
   - Onboarding effectiveness scores
   - Retention correlation with recruitment source

4. **Integration with External Systems**
   - ATS (Applicant Tracking Systems)
   - Payroll providers (ADP, Gusto, etc.)
   - Benefits providers
   - Learning Management Systems (LMS)
