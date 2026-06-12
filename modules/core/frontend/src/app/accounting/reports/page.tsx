"use client";

import Link from "next/link";
import {
  FileText,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileCheck,
  PieChart,
  ArrowRight,
} from "lucide-react";

const reports = [
  {
    id: "balance-sheet",
    title: "Balance Sheet",
    description: "View assets, liabilities, and equity at a specific point in time",
    icon: PieChart,
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    href: "/accounting/reports/balance-sheet",
  },
  {
    id: "income-statement",
    title: "Income Statement",
    description: "Review revenue, expenses, and profitability for a period",
    icon: TrendingUp,
    color: "text-green-500",
    bgColor: "bg-green-50",
    href: "/accounting/reports/income-statement",
  },
  {
    id: "cash-flow",
    title: "Cash Flow Statement",
    description: "Analyze cash inflows and outflows from operations",
    icon: DollarSign,
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    href: "/accounting/reports/cash-flow",
  },
  {
    id: "trial-balance",
    title: "Trial Balance",
    description: "Verify that debits equal credits across all accounts",
    icon: FileCheck,
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    href: "/accounting/reports/trial-balance",
  },
  {
    id: "general-ledger",
    title: "General Ledger",
    description: "Detailed transaction history for specific accounts",
    icon: FileText,
    color: "text-red-500",
    bgColor: "bg-red-50",
    href: "/accounting/reports/general-ledger",
  },
  {
    id: "custom",
    title: "Custom Reports",
    description: "Build custom reports with filters and date ranges",
    icon: BarChart3,
    color: "text-indigo-500",
    bgColor: "bg-indigo-50",
    href: "/accounting/reports/custom",
  },
];

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Financial Reports</h1>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Available Reports</span>
            <span className="text-xl font-bold text-gray-900">{reports.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Last Generated</span>
            <span className="text-xl font-bold text-gray-900">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Export Options</span>
            <span className="text-xl font-bold text-gray-900">PDF, Excel, CSV</span>
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Link
              key={report.id}
              href={report.href}
              className="group bg-card border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-12 h-12 ${report.bgColor} rounded-lg flex items-center justify-center mb-4`}
              >
                <Icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary">
                {report.title}
              </h3>
              <div className="flex items-center text-primary font-medium">
                <span>View Report</span>
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Report Types Explanation */}
      <div className="mt-12 bg-muted/30 border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Understanding Financial Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Balance Sheet
            </h3>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Income Statement
            </h3>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              Cash Flow Statement
            </h3>
          </div>

          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-orange-500" />
              Trial Balance
            </h3>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="mt-8 bg-card border rounded-lg p-6">
        <h2 className="text-lg font-bold mb-4">Export & Sharing Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">PDF Export</h3>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Excel/CSV</h3>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Email Reports</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
