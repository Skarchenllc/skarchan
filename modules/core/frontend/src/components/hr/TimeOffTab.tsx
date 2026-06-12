"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason?: string;
  applied_date?: string;
}

interface LeaveBalance {
  leave_type: string;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

interface TimeOffTabProps {
  employee: Employee;
  leaveRequests: LeaveRequest[];
  leaveBalance: LeaveBalance[];
  onLeaveRequestSubmit: (formData: any) => Promise<{ success: boolean; error?: string }>;
}

export default function TimeOffTab({
  employee,
  leaveRequests,
  leaveBalance,
  onLeaveRequestSubmit,
}: TimeOffTabProps) {
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
    total_days: 0,
  });

  // Auto-calculate total days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setFormData({ ...formData, total_days: diffDays });
    }
  }, [formData.start_date, formData.end_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_date || !formData.end_date || !formData.reason) {
      alert("Please fill in all required fields");
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      alert("End date must be after start date");
      return;
    }

    setSubmitting(true);
    const result = await onLeaveRequestSubmit(formData);

    if (result.success) {
      alert("Leave request submitted successfully!");
      // Reset form
      setFormData({
        leave_type: "vacation",
        start_date: "",
        end_date: "",
        reason: "",
        total_days: 0,
      });
    } else {
      alert(result.error || "Failed to submit leave request");
    }

    setSubmitting(false);
  };

  // Calendar utilities
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInLeave = (date: Date) => {
    return leaveRequests.filter((leave) => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      return date >= start && date <= end;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "vacation":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "sick":
        return "bg-red-100 text-red-800 border-red-300";
      case "personal":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "maternity":
        return "bg-pink-100 text-pink-800 border-pink-300";
      case "paternity":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-24 bg-gray-50 border border-gray-200"></div>
      );
    }

    // Days of the month with leave entries
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const leavesOnDay = isDateInLeave(date);
      const isToday =
        date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`min-h-24 border border-gray-200 p-2 ${
            isToday ? "bg-blue-50 border-blue-300" : "bg-white"
          }`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? "text-blue-600" : "text-gray-900"}`}>
            {day}
          </div>
          <div className="space-y-1">
            {leavesOnDay.map((leave) => (
              <div
                key={leave.id}
                className={`text-xs px-2 py-1 rounded border ${getLeaveTypeColor(leave.leave_type)}`}
              >
                {leave.leave_type}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const filteredRequests = leaveRequests.filter((req) => {
    if (filterStatus === "all") return true;
    return req.status.toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content - 2/3 width */}
      <div className="lg:col-span-2 space-y-6">
        {/* Leave Request Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 text-blue-600 mr-2" />
            Request Time Off
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type *
                </label>
                <select
                  value={formData.leave_type}
                  onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vacation">Vacation Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Days
                </label>
                <input
                  type="text"
                  value={formData.total_days || "0"}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  min={formData.start_date || new Date().toISOString().split("T")[0]}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason *
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
                placeholder="Please provide a reason for your leave request..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Request</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Calendar / List View */}
        <div className="bg-white rounded-lg border border-gray-200">
          {/* Calendar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
              </h3>

              <div className="flex items-center space-x-2">
                {/* View Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("calendar")}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      viewMode === "calendar"
                        ? "bg-white text-blue-600 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      viewMode === "list"
                        ? "bg-white text-blue-600 shadow"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={previousMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  >
                    Today
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Calendar Grid or List View */}
          {viewMode === "calendar" ? (
            <div className="p-4">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-semibold text-gray-700 py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-0">{renderCalendar()}</div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                  <span className="text-sm text-gray-600">Vacation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                  <span className="text-sm text-gray-600">Sick</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded"></div>
                  <span className="text-sm text-gray-600">Personal</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {filteredRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No leave requests found</p>
                </div>
              ) : (
                filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded ${getLeaveTypeColor(
                              request.leave_type
                            )}`}
                          >
                            {request.leave_type}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded flex items-center space-x-1 ${getStatusColor(
                              request.status
                            )}`}
                          >
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 font-medium">
                          {new Date(request.start_date).toLocaleDateString()} -{" "}
                          {new Date(request.end_date).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          {request.total_days} day{request.total_days !== 1 ? "s" : ""}
                        </div>
                        {request.reason && (
                          <div className="text-sm text-gray-500 mt-1">{request.reason}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar - 1/3 width */}
      <div className="space-y-6">
        {/* Leave Balance */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Leave Balance</h3>

          <div className="space-y-4">
            {leaveBalance.map((balance, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {balance.leave_type}
                  </span>
                  <span className="text-sm text-gray-600">
                    {balance.remaining_days} / {balance.total_days} days
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${(balance.remaining_days / balance.total_days) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Requests</h3>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-3">
            {filteredRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${getLeaveTypeColor(
                      request.leave_type
                    )}`}
                  >
                    {request.leave_type}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded flex items-center space-x-1 ${getStatusColor(
                      request.status
                    )}`}
                  >
                    {getStatusIcon(request.status)}
                    <span>{request.status}</span>
                  </span>
                </div>
                <div className="text-sm text-gray-900">
                  {new Date(request.start_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  -{" "}
                  {new Date(request.end_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {request.total_days} day{request.total_days !== 1 ? "s" : ""}
                </div>
              </div>
            ))}

            {filteredRequests.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No requests found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
