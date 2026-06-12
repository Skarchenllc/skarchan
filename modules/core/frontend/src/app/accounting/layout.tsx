import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ModuleGuard from "@shared/components/ModuleGuard";
import { ToastProvider } from "@/context/accounting/toast-context";
import ModuleBanner from "@/components/ModuleBanner";
import FinancialKpis from "@/components/accounting/FinancialKpis";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accounting & Finance",
  description: "Enterprise Accounting and Finance Management System",
};
// Ordered along the accounting workflow: operational money in/out →
// cash reconciliation → recording layer → recurring runs → planning →
// reporting → setup. Items within each group flow in the order an
// accountant actually touches them.
const TABS = [
  { label: 'Dashboard', href: '/accounting', exact: true },
  {
    // Money in: customer → invoice → payment → reminders
    label: 'Receivable (AR)',
    items: [
      { label: 'Customers',         href: '/accounting/accounting-customers' },
      { label: 'Invoices',          href: '/accounting/invoices' },
      { label: 'Invoice Payments',  href: '/accounting/invoice-payments' },
      { label: 'Payment Reminders', href: '/accounting/payment-reminders' },
    ],
  },
  {
    // Money out: vendor → PO → receipt → bill → payment → batch
    label: 'Payable (AP)',
    items: [
      { label: 'Vendors',         href: '/accounting/vendors' },
      { label: 'Purchase Orders', href: '/accounting/purchase-orders' },
      { label: 'PO Receipts',     href: '/accounting/po-receipts' },
      { label: 'Bills',           href: '/accounting/bills' },
      { label: 'Bill Payments',   href: '/accounting/bill-payments' },
      { label: 'Batch Payments',  href: '/accounting/batch-payments' },
    ],
  },
  {
    // Actual cash movement → reconciliation
    label: 'Banking',
    items: [
      { label: 'Bank Accounts',          href: '/accounting/bank-accounts' },
      { label: 'Bank Statements',        href: '/accounting/bank-statements' },
      { label: 'Statement Transactions', href: '/accounting/bank-statement-transactions' },
      { label: 'Bank Reconciliations',   href: '/accounting/bank-reconciliations' },
      { label: 'Reconciliation Items',   href: '/accounting/reconciliation-items' },
    ],
  },
  {
    // Recording: structure → entries → posted ledger → insight
    label: 'General Ledger',
    items: [
      { label: 'Accounts',       href: '/accounting/accounts' },
      { label: 'Journal',        href: '/accounting/journal' },
      { label: 'Transactions',   href: '/accounting/transactions' },
      { label: 'Ledgers',        href: '/accounting/ledgers' },
      { label: 'Reconciliation', href: '/accounting/reconciliation' },
      { label: 'Insights',       href: '/accounting/insights' },
    ],
  },
  {
    // Recurring HR expense — definitions → roster → run → output → posting
    label: 'Payroll',
    items: [
      { label: 'Salary Structures', href: '/accounting/salary-structures' },
      { label: 'Payroll Employees', href: '/accounting/payroll-employees' },
      { label: 'Time Entries',      href: '/accounting/time-entries' },
      { label: 'Payroll Runs',      href: '/accounting/payroll-runs' },
      { label: 'Payslips',          href: '/accounting/payslips' },
      { label: 'Payroll Journals',  href: '/accounting/payroll-journals' },
      { label: 'Payroll',           href: '/accounting/payroll' },
    ],
  },
  {
    // Capex tracking — assets → depreciation; subscriptions live alongside.
    label: 'Fixed Assets',
    items: [
      { label: 'Fixed Assets',   href: '/accounting/fixed-assets' },
      { label: 'Asset Register', href: '/accounting/asset-management' },
      { label: 'Depreciation',   href: '/accounting/depreciation' },
      { label: 'Subscriptions',  href: '/accounting/subscriptions' },
    ],
  },
  {
    // Forward planning — templates → budgets → lines → revisions → scenarios → alerts
    label: 'Budgets',
    items: [
      { label: 'Budget Templates', href: '/accounting/budget-templates' },
      { label: 'Budgets',          href: '/accounting/budgets' },
      { label: 'Budget Lines',     href: '/accounting/budget-lines' },
      { label: 'Budget Revisions', href: '/accounting/budget-revisions' },
      { label: 'Budget Scenarios', href: '/accounting/budget-scenarios' },
      { label: 'Budget Alerts',    href: '/accounting/budget-alerts' },
    ],
  },
  {
    // Output: detail → primary statements → analytical → index
    label: 'Reports',
    items: [
      { label: 'General Ledger',   href: '/accounting/reports/general-ledger' },
      { label: 'Trial Balance',    href: '/accounting/reports/trial-balance' },
      { label: 'Income Statement', href: '/accounting/reports/income-statement' },
      { label: 'Balance Sheet',    href: '/accounting/reports/balance-sheet' },
      { label: 'Cash Flow',        href: '/accounting/reports/cash-flow' },
      { label: 'All Reports',      href: '/accounting/reports' },
    ],
  },
  {
    // Setup: foundational → periods → currencies → tax → payment methods
    label: 'Settings',
    items: [
      { label: 'Chart of Accounts',   href: '/accounting/chart-of-accounts' },
      { label: 'Accounting Periods',  href: '/accounting/accounting-periods' },
      { label: 'Period Adjustments',  href: '/accounting/period-adjustments' },
      { label: 'Period Closings',     href: '/accounting/period-closings' },
      { label: 'Year-End Closings',   href: '/accounting/year-end-closings' },
      { label: 'Currencies',          href: '/accounting/currencies' },
      { label: 'Exchange Rates',      href: '/accounting/exchange-rates' },
      { label: 'FX Transactions',     href: '/accounting/currency-exchange-transactions' },
      { label: 'Unrealized FX',       href: '/accounting/unrealized-gain-loss' },
      { label: 'Tax Rates',           href: '/accounting/tax-rates' },
      { label: 'Tax Configurations',  href: '/accounting/tax-configurations' },
      { label: 'Tax Settings',        href: '/accounting/tax-settings' },
      { label: 'Tax Payments',        href: '/accounting/tax-payments' },
      { label: 'Payment Methods',     href: '/accounting/settings' },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ToastProvider>
      <ModuleGuard moduleCode="accounting">
        <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
          Accounting &amp; Finance
        </h1>
        <ModuleBanner tabs={TABS} />
        <FinancialKpis />
        {children}
      </ModuleGuard>
    </ToastProvider>
  );
}
