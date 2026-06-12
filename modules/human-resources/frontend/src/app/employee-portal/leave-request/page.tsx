"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";

interface LeaveBalance {
  leave_type: string;
  total_allocated: number;
  total_used: number;
  total_available: number;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  employee_code: string;
}

export default function LeaveRequestPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    leave_type: "vacation",
    start_date: "",
    end_date: "",
    reason: "",
    total_days: 0,
  });

  useEffect(() => {
    // Check if logged in
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/employee-portal/login");
      return;
    }

    loadEmployeeData(employeeId);
  }, [router]);

  // Calculate total days when dates change
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
      setFormData({ ...formData, total_days: diffDays });
    }
  }, [formData.start_date, formData.end_date]);

  const loadEmployeeData = async (employeeId: string) => {
    try {
      const [empRes, balanceRes] = await Promise.all([
        fetch(`/api/hr/employees`),
        fetch(`/api/hr/leave-balances?employee_id=${employeeId}`),
      ]);

      if (empRes.ok) {
        const employees = await empRes.json();
        const emp = employees.find((e: Employee) => e.id === employeeId);
        setEmployee(emp);
      }

      if (balanceRes.ok) {
        const balances = await balanceRes.json();
        setLeaveBalance(balances);
      }
    } catch (err) {
      console.error("Failed to load employee data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Validation
    if (!formData.start_date || !formData.end_date) {
      setError("Please select both start and end dates");
      setSubmitting(false);
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setError("End date must be after start date");
      setSubmitting(false);
      return;
    }

    // Check if enough leave balance
    const balance = leaveBalance.find(b => b.leave_type === formData.leave_type);
    if (balance && formData.total_days > balance.total_available) {
      setError(`Insufficient ${formData.leave_type} leave balance. You have ${balance.total_available} days available.`);
      setSubmitting(false);
      return;
    }

    if (!formData.reason.trim()) {
      setError("Please provide a reason for your leave request");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/hr/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee?.id,
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          total_days: formData.total_days,
          reason: formData.reason,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit leave request");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/employee-portal/dashboard");
      }, 2000);
    } catch (err) {
      setError("Failed to submit leave request. Please try again.");
      setSubmitting(false);
    }
  };

  const getBalanceColor = (available: number, allocated: number) => {
    const percentage = (available / allocated) * 100;
    if (percentage > 50) return "text-green-600";
    if (percentage > 25) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your leave request has been submitted successfully and is pending approval.
          </p>
          <div className="text-sm text-gray-500">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeePortalHeader />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Request Leave</h1>
            <span className="text-gray-400">|</span>
            <p className="text-sm text-gray-600">Submit a new leave request</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leave Balance Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Clock className="w-5 h-5 text-blue-600 mr-2" />
                Leave Balance
              </h3>
              <div className="space-y-4">
                {leaveBalance.map((balance) => (
                  <div key={balance.leave_type} className="border-b pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {balance.leave_type}
                      </span>
                      <span className={`text-lg font-bold ${getBalanceColor(balance.total_available, balance.total_allocated)}`}>
                        {balance.total_available}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{balance.total_used} used</span>
                      <span>{balance.total_allocated} total</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${(balance.total_available / balance.total_allocated) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Leave requests are subject to manager approval. You'll receive a notification once your request is reviewed.
                </p>
              </div>
            </div>
          </div>

          {/* Leave Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Leave Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.leave_type}
                    onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="vacation">Vacation Leave</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal Leave</option>
                    <option value="emergency">Emergency Leave</option>
                    <option value="unpaid">Unpaid Leave</option>
                  </select>
                  {formData.leave_type && (
                    <p className="text-xs text-gray-500 mt-1">
                      Available: {leaveBalance.find(b => b.leave_type === formData.leave_type)?.total_available || 0} days
                    </p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.start_date || new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Total Days Display */}
                {formData.total_days > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">Total Days Requested:</span>
                      <span className="text-2xl font-bold text-blue-600">{formData.total_days}</span>
                    </div>
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide a brief reason for your leave request..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.reason.length}/500 characters
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                  <Link
                    href="/employee-portal/dashboard"
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Submit Request</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-lg shadow p-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 text-gray-600 mr-2" />
                Leave Request Guidelines
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Submit leave requests at least 2 weeks in advance for planned leave</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>For sick leave, notify your manager as soon as possible</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Emergency leave requests will be processed on a case-by-case basis</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Ensure you have sufficient leave balance before submitting</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>You'll receive an email notification once your request is approved or rejected</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
