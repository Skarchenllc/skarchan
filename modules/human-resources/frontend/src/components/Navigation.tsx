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
    href: '/dashboard',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'People',
    icon: Users,
    type: 'dropdown' as const,
    items: [
      { name: 'Employees', href: '/employees', icon: Users },
      { name: 'Departments', href: '/departments', icon: Building },
      { name: 'Positions', href: '/positions', icon: Briefcase },
    ],
  },
  {
    name: 'Recruiting',
    icon: UserPlus,
    type: 'dropdown' as const,
    items: [
      { name: 'Job Requisitions', href: '/job-requisitions', icon: ClipboardList },
      { name: 'Job Offers', href: '/job-offers', icon: FileText },
      { name: 'Applicants', href: '/applicants', icon: Users },
      { name: 'Interviews', href: '/interviews', icon: CalendarCheck },
      { name: 'Background Checks', href: '/background-checks', icon: ShieldCheck },
    ],
  },
  {
    name: 'Time Off',
    icon: CalendarOff,
    type: 'dropdown' as const,
    items: [
      { name: 'Attendance', href: '/attendance', icon: Clock },
      { name: 'Leaves', href: '/leaves', icon: CalendarOff },
      { name: 'Leave Requests', href: '/leave-requests', icon: ClipboardList },
      { name: 'Leave Balances', href: '/leave-balances', icon: CalendarCheck },
    ],
  },
  {
    name: 'Payroll',
    icon: DollarSign,
    type: 'dropdown' as const,
    items: [
      { name: 'Payroll Runs', href: '/payroll-runs', icon: DollarSign },
      { name: 'Payslips', href: '/payslips', icon: Receipt },
      { name: 'Pay Grades', href: '/pay-grades', icon: TrendingUp },
      { name: 'Salary Bands', href: '/salary-bands', icon: TrendingUp },
      { name: 'Salary Adjustments', href: '/salary-adjustments', icon: TrendingUp },
      { name: 'Bonuses', href: '/bonuses', icon: Award },
      { name: 'Commissions', href: '/commissions', icon: Award },
    ],
  },
  {
    name: 'Benefits',
    icon: HeartPulse,
    type: 'dropdown' as const,
    items: [
      { name: 'Benefits Plans', href: '/benefits-plans', icon: HeartPulse },
      { name: 'Employee Benefits', href: '/employee-benefits', icon: HeartPulse },
      { name: 'Compensation', href: '/compensation', icon: DollarSign },
    ],
  },
  {
    name: 'Performance',
    icon: Award,
    type: 'dropdown' as const,
    items: [
      { name: 'Performance Reviews', href: '/performance-reviews', icon: Award },
      { name: 'Assessments', href: '/assessments', icon: ClipboardList },
      { name: 'Training', href: '/training', icon: GraduationCap },
      { name: 'Learning', href: '/learning', icon: GraduationCap },
      { name: 'Employee Credentials', href: '/employee-credentials', icon: ShieldCheck },
    ],
  },
];

export default function Navigation() {
  return <SharedHeader moduleName="HR" navigationGroups={navigationGroups} />;
}
