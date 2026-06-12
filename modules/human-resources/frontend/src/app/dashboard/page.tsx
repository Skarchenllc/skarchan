"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Award,
  AlertCircle,
  CheckCircle,
  FileText,
  DollarSign,
  Briefcase,
  Activity,
  Bell,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";
import Link from "next/link";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  employment_status: string;
  employment_type: string;
  department_id?: string;
  job_title?: string;
  hire_date: string;
  base_salary?: number;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  status: string;
  total_hours?: number;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  overall_rating?: number;
  is_finalized: boolean;
}

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  pendingLeaveRequests: number;
  todayAttendance: number;
  pendingReviews: number;
  avgPerformanceRating: number;
  totalPayroll: number;
}

export default function DashboardPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [empRes, leaveRes, attendRes, perfRes] = await Promise.all([
        fetch("/api/hr/employees"),
        fetch("/api/hr/leave-requests"),
        fetch("/api/hr/attendance?start_date=" + new Date().toISOString().split('T')[0] + "&end_date=" + new Date().toISOString().split('T')[0]),
        fetch("/api/hr/performance-reviews"),
      ]);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data);
      }
      if (leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaveRequests(data);
      }
      if (attendRes.ok) {
        const data = await attendRes.json();
        setAttendanceRecords(data);
      }
      if (perfRes.ok) {
        const data = await perfRes.json();
        setPerformanceReviews(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const stats: DashboardStats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.employment_status === "active").length,
    onLeave: employees.filter(e => e.employment_status === "on_leave").length,
    pendingLeaveRequests: leaveRequests.filter(r => r.status === "pending").length,
    todayAttendance: attendanceRecords.filter(r => r.status === "present").length,
    pendingReviews: performanceReviews.filter(r => !r.is_finalized).length,
    avgPerformanceRating: performanceReviews.length > 0
      ? performanceReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / performanceReviews.length
      : 0,
    totalPayroll: employees.reduce((sum, e) => sum + (e.base_salary || 0), 0),
  };

  const recentLeaveRequests = leaveRequests
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const upcomingLeaves = leaveRequests
    .filter(r => r.status === "approved" && new Date(r.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "vacation": return "text-gray-600";
      case "sick": return "text-red-600";
      case "personal": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading dashboard...</p>
          </div>
        ) : (
          <>
            {/* Unified Card Design */}
            <div className="bg-white rounded-t-lg shadow">
              {/* Page Header */}
              <div className="p-6 pb-8 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
              </div>

              {/* Stats - with light background */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Employees:</span> {stats.totalEmployees}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Active:</span> {stats.activeEmployees}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">On Leave:</span> {stats.onLeave}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Attendance:</span> {stats.todayAttendance} ({stats.todayAttendance > 0 ? Math.round((stats.todayAttendance / stats.activeEmployees) * 100) : 0}% present)
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Departments:</span> {new Set(employees.map(e => e.department_id).filter(Boolean)).size}
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="font-medium">Annual Payroll:</span> ${(stats.totalPayroll / 1000000).toFixed(2)}M
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="px-6 py-4 border-b border-gray-200">
                <Link href="/employees" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-block mr-3">
                  Add Employee
                </Link>
                <Link href="/leaves" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-block mr-3">
                  Leave Request
                </Link>
                <Link href="/attendance" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-block mr-3">
                  Mark Attendance
                </Link>
                <Link href="/reports" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-block">
                  Generate Report
                </Link>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-gray-200">
                {/* Recent Leave Requests */}
                <div className="p-6 border-r border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Leave Requests</h2>
                    <Link href="/leaves" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  <div>
                  {recentLeaveRequests.length === 0 ? (
                    <div className="text-center py-8 pt-24">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent leave requests</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {recentLeaveRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{getEmployeeName(request.employee_id)}</p>
                            <p className="text-sm text-gray-600">
                              <span className={getLeaveTypeColor(request.leave_type)}>{request.leave_type}</span> • {request.total_days} days
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>

                {/* Upcoming Leaves */}
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Upcoming Leaves</h2>
                    <Link href="/leaves" className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                      View All <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                  <div>
                  {upcomingLeaves.length === 0 ? (
                    <div className="text-center py-8 pt-24">
                      <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No upcoming leaves</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {upcomingLeaves.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{getEmployeeName(request.employee_id)}</p>
                            <p className="text-sm text-gray-600">
                              <span className={getLeaveTypeColor(request.leave_type)}>{request.leave_type}</span> • {request.total_days} days
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Starts {new Date(request.start_date).toLocaleDateString()}
                            </p>
                          </div>
                          <Calendar className="w-8 h-8 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>

              {/* Alerts & Notifications */}
              <div className="p-6">
                <h2 className="text-lg font-semibold flex items-center mb-4">
                  <Bell className="w-5 h-5 mr-2 text-blue-600" />
                  Alerts & Notifications
                </h2>
                <div>
                <div className="space-y-3">
                  {stats.pendingLeaveRequests > 0 && (
                    <div className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900">Pending Leave Requests</p>
                        <p className="text-sm text-yellow-700">
                          You have {stats.pendingLeaveRequests} leave request{stats.pendingLeaveRequests > 1 ? 's' : ''} awaiting approval
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.pendingReviews > 0 && (
                    <div className="flex items-start p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-900">Pending Performance Reviews</p>
                        <p className="text-sm text-blue-700">
                          {stats.pendingReviews} performance review{stats.pendingReviews > 1 ? 's' : ''} need{stats.pendingReviews === 1 ? 's' : ''} to be finalized
                        </p>
                      </div>
                    </div>
                  )}
                  {stats.pendingLeaveRequests === 0 && stats.pendingReviews === 0 && (
                    <div className="flex items-start p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-900">All Caught Up!</p>
                        <p className="text-sm text-green-700">
                          No pending actions required at this time
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
