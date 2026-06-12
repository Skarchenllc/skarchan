"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Check,
  X,
  Clock,
  Filter,
  Users,
  TrendingUp,
  Edit
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason?: string;
  status: string;
  approved_by_id?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  leave_type: string;
  year: number;
  total_allocated: number;
  total_used: number;
  total_pending: number;
  total_available: number;
}

export default function LeavesPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState<Partial<LeaveRequest>>({});

  useEffect(() => {
    loadLeaveRequests();
    loadEmployees();
  }, []);

  const loadLeaveRequests = async () => {
    try {
      const res = await fetch("/api/hr/leave-requests");
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data);
      }
    } catch (err) {
      console.error("Failed to load leave requests", err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate total days
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      formData.total_days = days;
    }

    try {
      const res = await fetch("/api/hr/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Leave request submitted successfully!");
        setShowRequestModal(false);
        setFormData({});
        loadLeaveRequests();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to submit leave request");
      }
    } catch (err) {
      alert("Failed to submit leave request");
    }
  };

  const handleUpdateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    // Calculate total days
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      formData.total_days = days;
    }

    try {
      const res = await fetch(`/api/hr/leave-requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Leave request updated successfully!");
        setShowEditModal(false);
        setFormData({});
        setSelectedRequest(null);
        loadLeaveRequests();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to update leave request");
      }
    } catch (err) {
      alert("Failed to update leave request");
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    if (!confirm("Are you sure you want to approve this leave request?")) return;

    try {
      // Use first employee as approver (in real app, use actual logged-in user)
      const approverId = employees[0]?.id || "00000000-0000-0000-0000-000000000000";
      const res = await fetch(`/api/hr/leave-requests/${requestId}/approve?approver_id=${approverId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        alert("Leave request approved!");
        loadLeaveRequests();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to approve leave request");
      }
    } catch (err) {
      alert("Failed to approve leave request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      // Pass reason as query parameter
      const res = await fetch(`/api/hr/leave-requests/${requestId}/reject?reason=${encodeURIComponent(reason)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        alert("Leave request rejected");
        loadLeaveRequests();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to reject leave request");
      }
    } catch (err) {
      alert("Failed to reject leave request");
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-gray-100 text-gray-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "cancelled": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "vacation": return "text-gray-600";
      case "sick": return "text-red-600";
      case "personal": return "text-gray-600";
      case "maternity": return "text-gray-600";
      case "paternity": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const filteredRequests = leaveRequests.filter(req =>
    filterStatus === "all" || req.status === filterStatus
  );

  const stats = {
    pending: leaveRequests.filter(r => r.status === "pending").length,
    approved: leaveRequests.filter(r => r.status === "approved").length,
    rejected: leaveRequests.filter(r => r.status === "rejected").length,
    total: leaveRequests.length,
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Requests:</span> {stats.total}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Pending:</span> {stats.pending}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Approved:</span> {stats.approved}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Rejected:</span> {stats.rejected}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              Request Leave
            </button>
          </div>

          {/* Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Filter className="w-5 h-5 text-gray-400" />
              <div className="flex space-x-2">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === status
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Leave Requests List - Spreadsheet Style */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading leave requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No leave requests found</p>
                <p className="text-sm text-gray-400">Submit your first leave request to get started</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Leave Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">End Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                        {getEmployeeName(request.employee_id)}
                      </td>
                      <td className="px-6 py-4 text-sm border border-gray-300 bg-white">
                        <span className={`capitalize ${getLeaveTypeColor(request.leave_type)}`}>
                          {request.leave_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                        {new Date(request.start_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                        {new Date(request.end_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                        {request.total_days}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white max-w-xs truncate" title={request.reason || ""}>
                        {request.reason || "-"}
                        {request.rejection_reason && (
                          <div className="text-red-600 text-xs mt-1" title={request.rejection_reason}>
                            Rejected: {request.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        {request.status === "pending" ? (
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                setSelectedRequest(request);
                                setFormData(request);
                                setShowEditModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleApproveRequest(request.id)}
                              className="p-1.5 text-green-600 hover:bg-green-100 rounded transition"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectRequest(request.id)}
                              className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Edit Leave Modal */}
      {showEditModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Edit Leave Request</h3>
              <button onClick={() => {
                setShowEditModal(false);
                setFormData({});
                setSelectedRequest(null);
              }}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateRequest} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee</label>
                  <input
                    disabled
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={getEmployeeName(formData.employee_id || "")}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Leave Type *</label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.leave_type || ""}
                    onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="bereavement">Bereavement</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.reason || ""}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Provide a reason for your leave request..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setFormData({});
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Leave Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Request Leave</h3>
              <button onClick={() => setShowRequestModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitRequest} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee *</label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.employee_id || ""}
                    onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.employee_code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Leave Type *</label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.leave_type || ""}
                    onChange={(e) => setFormData({...formData, leave_type: e.target.value})}
                  >
                    <option value="">Select Type</option>
                    <option value="vacation">Vacation</option>
                    <option value="sick">Sick Leave</option>
                    <option value="personal">Personal</option>
                    <option value="maternity">Maternity</option>
                    <option value="paternity">Paternity</option>
                    <option value="bereavement">Bereavement</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.start_date || ""}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.end_date || ""}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.reason || ""}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    placeholder="Provide a reason for your leave request..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
