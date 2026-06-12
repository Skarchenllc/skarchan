"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import LoadingSpinner from "@/components/compensation/LoadingSpinner";
import {
  Calendar,
  ArrowRight,
  Shield,
  Award,
  DollarSign,
} from "lucide-react";
import {
  CompensationOverview,
  SalaryAdjustment,
  Employee,
} from "@/types/compensation";
import {
  getEmployeeName,
  formatAdjustmentType,
  formatCurrencyCompact,
  formatDate
} from "@/utils/compensationHelpers";

export default function CompensationPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<CompensationOverview | null>(null);
  const [recentAdjustments, setRecentAdjustments] = useState<SalaryAdjustment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [overviewRes, adjustmentsRes, employeesRes] = await Promise.all([
        fetch("/api/hr/compensation/overview"),
        fetch("/api/hr/compensation/salary-adjustments/recent"),
        fetch("/api/hr/employees"),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (adjustmentsRes.ok) setRecentAdjustments(await adjustmentsRes.json());
      if (employeesRes.ok) setEmployees(await employeesRes.json());
    } catch (error) {
      console.error("Failed to load compensation data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Compensation & Benefits</h1>
            <p className="text-sm text-gray-600 mt-1">Overview and management of employee compensation, benefits, and bonuses</p>
          </div>

          {/* Stats - with light background */}
          {loading ? (
            <div className="px-6 bg-gray-50 border-b border-gray-200">
              <LoadingSpinner size="sm" message="" />
            </div>
          ) : overview ? (
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <span className="font-medium">Total Payroll:</span> {formatCurrencyCompact(overview.total_payroll)}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Avg Salary:</span> {formatCurrencyCompact(overview.avg_salary)}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Employees on Payroll:</span> {overview.employee_count}
                </p>
                <p>
                  <span className="font-medium">Benefits Spend:</span> {formatCurrencyCompact(overview.benefits_annual)} annual
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Bonuses YTD:</span> {formatCurrencyCompact(overview.bonuses_ytd)}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Total Compensation:</span> {formatCurrencyCompact(overview.total_compensation)}
                </p>
              </div>
            </div>
          ) : null}

          {/* Quick Links Section */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Salary Structure Link */}
              <Link
                href="/compensation/salary"
                className="group border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 rounded-lg p-3 group-hover:bg-blue-200 transition">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Salary Structure</h3>
                <p className="text-sm text-gray-600">Manage pay grades and salary bands</p>
              </Link>

              {/* Benefits Link */}
              <Link
                href="/compensation/benefits"
                className="group border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 rounded-lg p-3 group-hover:bg-green-200 transition">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Benefits Plans</h3>
                <p className="text-sm text-gray-600">Manage health, dental, and other benefits</p>
              </Link>

              {/* Bonuses Link */}
              <Link
                href="/compensation/bonuses"
                className="group border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-purple-100 rounded-lg p-3 group-hover:bg-purple-200 transition">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Bonuses & Incentives</h3>
                <p className="text-sm text-gray-600">Manage employee bonuses and commissions</p>
              </Link>
            </div>
          </div>

          {/* Overview Content - Recent Salary Adjustments */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Salary Adjustments</h2>

            {loading ? (
              <LoadingSpinner />
            ) : recentAdjustments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No salary adjustments found
              </div>
            ) : (
              <div className="space-y-4">
                {recentAdjustments.map((adjustment) => (
                  <div key={adjustment.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {getEmployeeName(adjustment.employee_id, employees)}
                          </h3>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {formatAdjustmentType(adjustment.adjustment_type)}
                          </span>
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            +{adjustment.adjustment_percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">Previous:</span>
                            <span className="font-medium">${adjustment.previous_salary.toLocaleString()}</span>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">New:</span>
                            <span className="font-semibold text-green-600">${adjustment.new_salary.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Effective: {formatDate(adjustment.effective_date)}</span>
                          </div>
                          {adjustment.approved_by && (
                            <div className="text-xs text-gray-500">Approved by: {adjustment.approved_by}</div>
                          )}
                        </div>
                        {adjustment.reason && (
                          <p className="text-sm text-gray-600 mt-2">{adjustment.reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
