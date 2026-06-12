'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  Users,
  Building,
  Briefcase,
  UserPlus,
  ClipboardList,
  CalendarCheck,
  CalendarOff,
  Clock,
  DollarSign,
  Receipt,
  TrendingUp,
  Award,
  HeartPulse,
  GraduationCap,
  ShieldCheck,
  FileText,
} from 'lucide-react';

// HR navigation structure
const navigationGroups = [
  {
    name: 'Dashboard',
    href: '/hr',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'People',
    icon: Users,
    type: 'dropdown' as const,
    items: [
      { name: 'Employees', href: '/hr/employees', icon: Users },
      { name: 'Departments', href: '/hr/departments', icon: Building },
      { name: 'Positions', href: '/hr/positions', icon: Briefcase },
    ],
  },
  {
    name: 'Recruiting',
    icon: UserPlus,
    type: 'dropdown' as const,
    items: [
      { name: 'Job Requisitions', href: '/hr/job-requisitions', icon: ClipboardList },
      { name: 'Job Offers', href: '/hr/job-offers', icon: FileText },
      { name: 'Applicants', href: '/hr/applicants', icon: Users },
      { name: 'Interviews', href: '/hr/interviews', icon: CalendarCheck },
      { name: 'Background Checks', href: '/hr/background-checks', icon: ShieldCheck },
    ],
  },
  {
    name: 'Time Off',
    icon: CalendarOff,
    type: 'dropdown' as const,
    items: [
      { name: 'Attendance', href: '/hr/attendance', icon: Clock },
      { name: 'Leaves', href: '/hr/leaves', icon: CalendarOff },
      { name: 'Leave Requests', href: '/hr/leave-requests', icon: ClipboardList },
      { name: 'Leave Balances', href: '/hr/leave-balances', icon: CalendarCheck },
    ],
  },
  {
    name: 'Payroll',
    icon: DollarSign,
    type: 'dropdown' as const,
    items: [
      { name: 'Payroll Runs', href: '/hr/payroll-runs', icon: DollarSign },
      { name: 'Payslips', href: '/hr/payslips', icon: Receipt },
      { name: 'Pay Grades', href: '/hr/pay-grades', icon: TrendingUp },
      { name: 'Salary Bands', href: '/hr/salary-bands', icon: TrendingUp },
      { name: 'Salary Adjustments', href: '/hr/salary-adjustments', icon: TrendingUp },
      { name: 'Bonuses', href: '/hr/bonuses', icon: Award },
      { name: 'Commissions', href: '/hr/commissions', icon: Award },
    ],
  },
  {
    name: 'Benefits',
    icon: HeartPulse,
    type: 'dropdown' as const,
    items: [
      { name: 'Benefits Plans', href: '/hr/benefits-plans', icon: HeartPulse },
      { name: 'Employee Benefits', href: '/hr/employee-benefits', icon: HeartPulse },
      { name: 'Compensation', href: '/hr/compensation', icon: DollarSign },
    ],
  },
  {
    name: 'Performance',
    icon: Award,
    type: 'dropdown' as const,
    items: [
      { name: 'Performance Reviews', href: '/hr/performance-reviews', icon: Award },
      { name: 'Assessments', href: '/hr/assessments', icon: ClipboardList },
      { name: 'Training', href: '/hr/training', icon: GraduationCap },
      { name: 'Learning', href: '/hr/learning', icon: GraduationCap },
      { name: 'Employee Credentials', href: '/hr/employee-credentials', icon: ShieldCheck },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="HR" navigationGroups={navigationGroups} />;
}
