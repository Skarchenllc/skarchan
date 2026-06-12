"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  BarChart,
  PieChart,
  Activity,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  employment_status: string;
  employment_type: string;
  department_id?: string;
  hire_date: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  status: string;
  total_days: number;
}

export default function ReportsPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, leaveRes] = await Promise.all([
        fetch("/api/hr/employees"),
        fetch("/api/hr/leave-requests"),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }

      if (leaveRes.ok) {
        const leaveData = await leaveRes.json();
        setLeaveRequests(leaveData);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // Employee Statistics
  const employeeStats = {
    total: employees.length,
    active: employees.filter(e => e.employment_status === "active").length,
    onLeave: employees.filter(e => e.employment_status === "on_leave").length,
    fullTime: employees.filter(e => e.employment_type === "full_time").length,
    partTime: employees.filter(e => e.employment_type === "part_time").length,
    contract: employees.filter(e => e.employment_type === "contract").length,
  };

  // Leave Statistics
  const leaveStats = {
    total: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === "pending").length,
    approved: leaveRequests.filter(r => r.status === "approved").length,
    rejected: leaveRequests.filter(r => r.status === "rejected").length,
    totalDays: leaveRequests
      .filter(r => r.status === "approved")
      .reduce((sum, r) => sum + r.total_days, 0),
  };

  // Leave by Type
  const leaveByType = {
    vacation: leaveRequests.filter(r => r.leave_type === "vacation").length,
    sick: leaveRequests.filter(r => r.leave_type === "sick").length,
    personal: leaveRequests.filter(r => r.leave_type === "personal").length,
    other: leaveRequests.filter(r => !["vacation", "sick", "personal"].includes(r.leave_type)).length,
  };

  const reportTypes = [
    {
      title: "Employee Roster Report",
      icon: <Users className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
    {
      title: "Leave Summary Report",
      icon: <Calendar className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
    {
      title: "Attendance Report",
      icon: <Activity className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
    {
      title: "Performance Report",
      icon: <TrendingUp className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
    {
      title: "Headcount Report",
      icon: <BarChart className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
    {
      title: "Custom Report",
      icon: <PieChart className="w-5 h-5 text-gray-900" />,
      color: "bg-gray-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 pb-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">HR Reports & Analytics</h1>
          </div>

          {/* Compact Statistics Bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Total Employees</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.total}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.active}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">On Leave</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.onLeave}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Full-time</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.fullTime}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Part-time</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.partTime}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Contract</span>
                <span className="text-xl font-bold text-gray-900">{employeeStats.contract}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Leave Requests</span>
                <span className="text-xl font-bold text-gray-900">{leaveStats.total}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-xl font-bold text-gray-900">{leaveStats.pending}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Approved</span>
                <span className="text-xl font-bold text-gray-900">{leaveStats.approved}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-900" />
                <span className="text-sm text-gray-600">Total Days Approved</span>
                <span className="text-xl font-bold text-gray-900">{leaveStats.totalDays}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{ display: 'none' }}>
            {/* Employee Stats */}
            <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              Employee Overview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Employees:</span>
                <span className="font-semibold">{employeeStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active:</span>
                <span className="font-semibold text-gray-900">{employeeStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">On Leave:</span>
                <span className="font-semibold text-gray-900">{employeeStats.onLeave}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full-time:</span>
                  <span className="font-semibold">{employeeStats.fullTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Part-time:</span>
                  <span className="font-semibold">{employeeStats.partTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Contract:</span>
                  <span className="font-semibold">{employeeStats.contract}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leave Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Leave Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Requests:</span>
                <span className="font-semibold">{leaveStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="font-semibold text-gray-900">{leaveStats.pending}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Approved:</span>
                <span className="font-semibold text-gray-900">{leaveStats.approved}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Rejected:</span>
                <span className="font-semibold text-gray-900">{leaveStats.rejected}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Days Approved:</span>
                  <span className="font-semibold">{leaveStats.totalDays}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Leave by Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <PieChart className="w-5 h-5 mr-2 text-blue-600" />
              Leave by Type
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Vacation:</span>
                <span className="font-semibold text-gray-900">{leaveByType.vacation}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Sick Leave:</span>
                <span className="font-semibold text-red-600">{leaveByType.sick}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Personal:</span>
                <span className="font-semibold text-gray-900">{leaveByType.personal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Other:</span>
                <span className="font-semibold text-gray-900">{leaveByType.other}</span>
              </div>
            </div>
          </div>
          </div>

          {/* Available Reports */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading reports...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reportTypes.map((report, index) => (
                  <div
                    key={index}
                    className={`${report.color} rounded-lg p-6 border-2 border-transparent hover:border-blue-500 transition cursor-pointer`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      {report.icon}
                      <button className="flex items-center space-x-1 px-3 py-1 bg-white rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Notice Card */}
          <div className="p-6 bg-blue-50 border-t border-gray-200">
            <div className="flex items-start space-x-3">
              <FileText className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Report Generation</h3>
                <p className="text-sm text-blue-800">
                  Reports can be exported in multiple formats including PDF, Excel, and CSV.
                  Click the Export button on any report card to download the data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
