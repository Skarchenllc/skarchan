'use client';

import SharedHeader from './SharedHeader';
import {
  LayoutDashboard,
  BookOpen,
  ArrowLeftRight,
  Book,
  BookMarked,
  RefreshCw,
  Building2,
  Users,
  Receipt,
  FileText,
  DollarSign,
  TrendingUp,
  PieChart,
  Calendar,
  Wallet,
  BarChart3,
  Settings,
} from 'lucide-react';

// Navigation structure with groups
const navigationGroups = [
  {
    name: 'Dashboard',
    href: '/accounting',
    icon: LayoutDashboard,
    type: 'single' as const,
  },
  {
    name: 'Accounting',
    icon: BookOpen,
    type: 'dropdown' as const,
    items: [
      { name: 'Journal', href: '/accounting/journal', icon: Book },
      { name: 'Ledgers', href: '/accounting/ledgers', icon: BookMarked },
      { name: 'Transactions', href: '/accounting/transactions', icon: ArrowLeftRight },
      { name: 'Reconciliation', href: '/accounting/reconciliation', icon: RefreshCw },
      { name: 'Budgets', href: '/accounting/budgets', icon: PieChart },
      { name: 'Payroll', href: '/accounting/payroll', icon: Wallet },
      { name: 'Insights', href: '/accounting/insights', icon: BarChart3 },
    ],
  },
  {
    name: 'AP/AR',
    icon: Receipt,
    type: 'dropdown' as const,
    items: [
      { name: 'Vendors', href: '/accounting/vendors', icon: Building2 },
      { name: 'Bills', href: '/accounting/bills', icon: Receipt },
      { name: 'Customers', href: '/accounting/customers', icon: Users },
      { name: 'Invoices', href: '/accounting/invoices', icon: FileText },
    ],
  },
  {
    name: 'Assets & Subs',
    icon: Wallet,
    type: 'dropdown' as const,
    items: [
      { name: 'Asset Management', href: '/accounting/asset-management', icon: Wallet },
      { name: 'Subscriptions',    href: '/accounting/subscriptions',    icon: RefreshCw },
    ],
  },
  {
    name: 'Reports',
    icon: FileText,
    type: 'dropdown' as const,
    items: [
      { name: 'All Reports', href: '/accounting/reports', icon: FileText },
      { name: 'Balance Sheet', href: '/accounting/reports/balance-sheet', icon: FileText },
      { name: 'Income Statement', href: '/accounting/reports/income-statement', icon: FileText },
      { name: 'Cash Flow', href: '/accounting/reports/cash-flow', icon: FileText },
      { name: 'Trial Balance', href: '/accounting/reports/trial-balance', icon: FileText },
      { name: 'General Ledger', href: '/accounting/reports/general-ledger', icon: FileText },
    ],
  },
  {
    name: 'Settings',
    icon: Settings,
    type: 'dropdown' as const,
    items: [
      { name: 'Currencies', href: '/settings/currencies', icon: DollarSign },
      { name: 'Exchange Rates', href: '/settings/exchange-rates', icon: TrendingUp },
      { name: 'Fiscal Periods', href: '/settings/fiscal-periods', icon: Calendar },
      { name: 'Chart of Accounts', href: '/settings/chart-of-accounts', icon: BookOpen },
      { name: 'Tax Settings', href: '/settings/tax-rates', icon: Receipt },
      { name: 'Payment Methods', href: '/settings/payment-methods', icon: Wallet },
    ],
  },
];

export function Navigation() {
  return <SharedHeader moduleName="Accounting & Finance" navigationGroups={navigationGroups} />;
}
