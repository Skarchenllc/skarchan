"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Users,
  Filter,
} from "lucide-react";
import EmployeePortalHeader from "@/components/hr/EmployeePortalHeader";

interface LeaveRequest {
  id: string;
  employee_id: string;
  employee_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
}

export default function LeaveCalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("approved");
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/hr/employee-portal/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [leaveRes, empRes] = await Promise.all([
        fetch(`/api/hr/leave-requests`),
        fetch(`/api/hr/employees`),
      ]);

      if (leaveRes.ok) {
        const leaves = await leaveRes.json();
        setLeaveRequests(leaves);
      }

      if (empRes.ok) {
        const emps = await empRes.json();
        setEmployees(emps);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const isDateInLeave = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return leaveRequests.filter((leave) => {
      if (filterStatus && leave.status !== filterStatus) return false;
      const start = new Date(leave.start_date).toISOString().split("T")[0];
      const end = new Date(leave.end_date).toISOString().split("T")[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "vacation":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "sick":
        return "bg-red-100 text-red-800 border-red-300";
      case "personal":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "emergency":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-24 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const leavesOnDay = isDateInLeave(date);
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();

      days.push(
        <div
          key={day}
          className={`min-h-24 border border-gray-200 p-1 ${
            isToday ? "bg-blue-50 border-blue-400" : "bg-white"
          }`}
        >
          <div
            className={`text-xs font-semibold mb-1 ${
              isToday ? "text-blue-600" : "text-gray-700"
            }`}
          >
            {day}
          </div>
          <div className="space-y-0.5">
            {leavesOnDay.slice(0, 3).map((leave, idx) => (
              <div
                key={`${leave.id}-${idx}`}
                className={`text-xs px-1 py-0.5 rounded border ${getLeaveTypeColor(
                  leave.leave_type
                )} truncate`}
                title={`${getEmployeeName(leave.employee_id)} - ${leave.leave_type}`}
              >
                {getEmployeeName(leave.employee_id).split(" ")[0]}
              </div>
            ))}
            {leavesOnDay.length > 3 && (
              <div className="text-xs text-gray-500 px-1">+{leavesOnDay.length - 3} more</div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  const getUpcomingLeaves = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaveRequests
      .filter((leave) => {
        if (filterStatus && leave.status !== filterStatus) return false;
        const startDate = new Date(leave.start_date);
        return startDate >= today;
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 10);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeePortalHeader />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Leave Calendar</h1>
              <span className="text-gray-400">|</span>
              <p className="text-sm text-gray-600">View team leave schedule</p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    viewMode === "month"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  List
                </button>
              </div>

              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {viewMode === "month" ? (
          <>
            {/* Calendar Navigation */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={previousMonth}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="text-lg font-semibold text-gray-900">{getMonthName(currentDate)}</h2>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex items-center space-x-6">
                <h3 className="text-sm font-semibold text-gray-700">Leave Types:</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-xs text-gray-600">Vacation</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-xs text-gray-600">Sick</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
                  <span className="text-xs text-gray-600">Personal</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div>
                  <span className="text-xs text-gray-600">Emergency</span>
                </div>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="grid grid-cols-7 bg-gray-50 border-b">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">{renderCalendar()}</div>
            </div>
          </>
        ) : (
          /* List View */
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <Users className="w-5 h-5 text-blue-600 mr-2" />
                Upcoming Leave Requests
              </h3>
            </div>
            <div className="divide-y">
              {getUpcomingLeaves().length === 0 ? (
                <div className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No upcoming leaves found</p>
                </div>
              ) : (
                getUpcomingLeaves().map((leave) => (
                  <div key={leave.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {getEmployeeName(leave.employee_id)}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getLeaveTypeColor(
                              leave.leave_type
                            )}`}
                          >
                            {leave.leave_type}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                              leave.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : leave.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {leave.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            {new Date(leave.start_date).toLocaleDateString()} -{" "}
                            {new Date(leave.end_date).toLocaleDateString()}
                          </span>
                          <span className="text-gray-400">•</span>
                          <span>{leave.total_days} days</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
