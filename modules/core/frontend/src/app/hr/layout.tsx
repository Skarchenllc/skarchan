import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "HR",
};

const STATS = [
  { label: 'Employees', endpoint: '/api/v1/hr/employees' },
  { label: 'Departments', endpoint: '/api/v1/hr/departments' },
  { label: 'Open Leave Requests', endpoint: '/api/v1/hr/leave-requests' },
  { label: 'Positions', endpoint: '/api/v1/hr/positions' }
];
// Ordered along the employee lifecycle: hire → join → work → assess →
// pay → grow. Each group's items also flow chronologically within the
// stage they represent.
const TABS = [
  { label: 'Dashboard', href: '/hr', exact: true },
  {
    label: 'Recruitment',
    items: [
      { label: 'Hiring Pipeline (AI)', href: '/hr/recruitment' },
      { label: 'Job Requisitions',  href: '/hr/job-requisitions' },
      { label: 'Advertisements',    href: '/hr/advertisements' },
      { label: 'Applicants',        href: '/hr/applicants' },
      { label: 'Interviews',        href: '/hr/interviews' },
      { label: 'Background Checks', href: '/hr/background-checks' },
      { label: 'Job Offers',        href: '/hr/job-offers' },
    ],
  },
  {
    label: 'Employees',
    items: [
      { label: 'Employees',   href: '/hr/employees' },
      { label: 'Departments', href: '/hr/departments' },
      { label: 'Positions',   href: '/hr/positions' },
      { label: 'Credentials', href: '/hr/employee-credentials' },
    ],
  },
  {
    label: 'Leave & Time',
    items: [
      { label: 'Attendance',     href: '/hr/attendance' },
      { label: 'Leave Requests', href: '/hr/leave-requests' },
      { label: 'Leave Balances', href: '/hr/leave-balances' },
      { label: 'Time Off',       href: '/hr/time-off' },
    ],
  },
  {
    label: 'Performance',
    items: [
      { label: 'Performance',         href: '/hr/performance' },
      { label: 'Assessments',         href: '/hr/assessments' },
      { label: 'Performance Reviews', href: '/hr/performance-reviews' },
    ],
  },
  {
    label: 'Compensation',
    items: [
      { label: 'Compensation',       href: '/hr/compensation' },
      { label: 'Pay Grades',         href: '/hr/pay-grades' },
      { label: 'Salary Bands',       href: '/hr/salary-bands' },
      { label: 'Salary Adjustments', href: '/hr/salary-adjustments' },
      { label: 'Bonuses',            href: '/hr/bonuses' },
      { label: 'Commissions',        href: '/hr/commissions' },
      { label: 'Benefits Plans',     href: '/hr/benefits-plans' },
      { label: 'Benefits',           href: '/hr/employee-benefits' },
    ],
  },
  {
    label: 'Payroll',
    items: [
      { label: 'Payroll',      href: '/hr/payroll' },
      { label: 'Payroll Runs', href: '/hr/payroll-runs' },
      { label: 'Payslips',     href: '/hr/payslips' },
    ],
  },
  {
    label: 'Learning',
    items: [
      { label: 'Training', href: '/hr/training' },
      { label: 'Learning', href: '/hr/learning' },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="hr">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Human Resources
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
