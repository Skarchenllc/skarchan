"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  X,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Briefcase,
  Activity,
  Award,
  Star,
  Building2,
  Bell,
  ArrowRight,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  work_email?: string;
  personal_email?: string;
  work_phone?: string;
  personal_phone?: string;
  employment_type: string;
  employment_status: string;
  department_id?: string;
  job_title?: string;
  job_level?: string;
  hire_date: string;
  termination_date?: string;
  office_location?: string;
  work_arrangement?: string;
  base_salary?: number;
  hourly_rate?: number;
  pay_frequency?: string;
  currency?: string;
  overtime_eligible?: boolean;
  bonus_amount?: number;
  commission_rate?: number;
  bank_name?: string;
  bank_account_number?: string;
  bank_routing_number?: string;
  bank_account_type?: string;
  tax_id?: string;
  tax_filing_status?: string;
  tax_allowances?: number;
  tax_additional_withholding?: number;
  is_active: boolean;
}

interface Department {
  id: string;
  department_code: string;
  name: string;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  reason?: string;
  created_at?: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  total_hours?: number;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_date: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating?: number;
  goals_rating?: number;
  skills_rating?: number;
  attendance_rating?: number;
  comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  goals_next_period?: string;
  is_finalized: boolean;
  created_at: string;
}

export default function EmployeesPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "attendance" | "leaves" | "payroll" | "performance">("directory");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [formTab, setFormTab] = useState<"basic" | "employment" | "financial" | "banking" | "tax">("basic");

  // Checkbox selection state
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await Promise.all([
      loadEmployees(),
      loadDepartments(),
      loadLeaveRequests(),
      loadAttendanceRecords(),
      loadPerformanceReviews()
    ]);
    setLoading(false);
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

  const loadDepartments = async () => {
    try {
      const res = await fetch("/api/hr/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  };

  const loadLeaveRequests = async () => {
    try {
      const res = await fetch("/api/hr/leave-requests");
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data);
      }
    } catch (err) {
      console.error("Failed to load leave requests", err);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch(`/api/hr/attendance?start_date=${today}&end_date=${today}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data);
      }
    } catch (err) {
      console.error("Failed to load attendance", err);
    }
  };

  const loadPerformanceReviews = async () => {
    try {
      const res = await fetch("/api/hr/performance-reviews");
      if (res.ok) {
        const data = await res.json();
        setPerformanceReviews(data);
      }
    } catch (err) {
      console.error("Failed to load performance reviews", err);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Employee added successfully!");
        setShowAddModal(false);
        setFormData({});
        loadEmployees();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to add employee");
      }
    } catch (err) {
      alert("Failed to add employee");
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    try {
      const res = await fetch(`/api/hr/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Employee updated successfully!");
        setShowEditModal(false);
        setFormData({});
        setSelectedEmployee(null);
        loadEmployees();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to update employee");
      }
    } catch (err) {
      alert("Failed to update employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this employee?")) return;

    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Employee deactivated successfully");
        loadEmployees();
      }
    } catch (err) {
      alert("Failed to deactivate employee");
    }
  };

  const generateCSV = () => {
    const headers = [
      "Employee Code", "First Name", "Middle Name", "Last Name",
      "Work Email", "Personal Email", "Work Phone", "Personal Phone",
      "Employment Type", "Employment Status", "Job Title", "Job Level",
      "Department", "Hire Date", "Office Location", "Work Arrangement",
      "Base Salary", "Hourly Rate", "Pay Frequency", "Currency",
      "Overtime Eligible", "Bonus Amount", "Commission Rate",
      "Bank Name", "Account Type", "Tax Filing Status", "Tax Allowances"
    ];

    const rows = employees.map(emp => {
      const dept = departments.find(d => d.id === emp.department_id);
      return [
        emp.employee_code, emp.first_name, emp.middle_name || "", emp.last_name,
        emp.work_email || "", emp.personal_email || "", emp.work_phone || "", emp.personal_phone || "",
        emp.employment_type, emp.employment_status, emp.job_title || "", emp.job_level || "",
        dept ? dept.name : "", emp.hire_date, emp.office_location || "", emp.work_arrangement || "",
        emp.base_salary || "", emp.hourly_rate || "", emp.pay_frequency || "", emp.currency || "USD",
        emp.overtime_eligible ? "Yes" : "No", emp.bonus_amount || "", emp.commission_rate || "",
        emp.bank_name || "", emp.bank_account_type || "", emp.tax_filing_status || "", emp.tax_allowances || 0
      ].map(field => `"${field}"`).join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Checkbox handling functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(filteredEmployees.map(emp => emp.id));
      setSelectedEmployeeIds(allIds);
    } else {
      setSelectedEmployeeIds(new Set());
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    const newSelected = new Set(selectedEmployeeIds);
    if (checked) {
      newSelected.add(employeeId);
    } else {
      newSelected.delete(employeeId);
    }
    setSelectedEmployeeIds(newSelected);
  };

  // Bulk action handlers
  const handleBulkDelete = async () => {
    if (selectedEmployeeIds.size === 0) return;

    if (!confirm(`Are you sure you want to deactivate ${selectedEmployeeIds.size} employee(s)?`)) return;

    try {
      await Promise.all(
        Array.from(selectedEmployeeIds).map(id =>
          fetch(`/api/hr/employees/${id}`, { method: "DELETE" })
        )
      );
      alert(`${selectedEmployeeIds.size} employee(s) deactivated successfully`);
      setSelectedEmployeeIds(new Set());
      loadEmployees();
    } catch (err) {
      alert("Failed to deactivate employees");
    }
  };

  const handleBulkExport = () => {
    if (selectedEmployeeIds.size === 0) return;

    const selectedEmps = employees.filter(emp => selectedEmployeeIds.has(emp.id));
    const headers = [
      "Employee Code", "First Name", "Middle Name", "Last Name",
      "Work Email", "Personal Email", "Work Phone", "Personal Phone",
      "Employment Type", "Employment Status", "Job Title", "Job Level",
      "Department", "Hire Date", "Base Salary"
    ];

    const rows = selectedEmps.map(emp => {
      const dept = departments.find(d => d.id === emp.department_id);
      return [
        emp.employee_code, emp.first_name, emp.middle_name || "", emp.last_name,
        emp.work_email || "", emp.personal_email || "", emp.work_phone || "", emp.personal_phone || "",
        emp.employment_type, emp.employment_status, emp.job_title || "", emp.job_level || "",
        dept ? dept.name : "", emp.hire_date, emp.base_salary || ""
      ].map(field => `"${field}"`).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    downloadCSV(csv, `selected_employees_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedEmployeeIds.size === 0) return;

    if (!confirm(`Change status of ${selectedEmployeeIds.size} employee(s) to "${newStatus.replace("_", " ")}"?`)) return;

    try {
      await Promise.all(
        Array.from(selectedEmployeeIds).map(id =>
          fetch(`/api/hr/employees/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employment_status: newStatus }),
          })
        )
      );
      alert(`${selectedEmployeeIds.size} employee(s) status updated successfully`);
      setSelectedEmployeeIds(new Set());
      loadEmployees();
    } catch (err) {
      alert("Failed to update employee status");
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.work_email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || emp.employment_status === filterStatus;
    const matchesDepartment = filterDepartment === "all" || emp.department_id === filterDepartment;

    return matchesSearch && matchesStatus && matchesDepartment;
  });

  // Checkbox selection helpers
  const isAllSelected = filteredEmployees.length > 0 &&
    filteredEmployees.every(emp => selectedEmployeeIds.has(emp.id));

  const isSomeSelected = filteredEmployees.some(emp => selectedEmployeeIds.has(emp.id)) && !isAllSelected;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "on_leave": return "bg-yellow-100 text-yellow-800";
      case "on_probation": return "bg-blue-100 text-blue-800";
      case "suspended": return "bg-red-100 text-red-800";
      case "terminated": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return "-";
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : "-";
  };

  const renderStars = (rating?: number) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      );
    }
    return stars;
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-gray-400";
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  // Calculate analytics
  const analytics = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.employment_status === "active").length,
    onLeave: employees.filter(e => e.employment_status === "on_leave").length,
    todayAttendance: attendanceRecords.filter(r => r.status === "present").length,
    pendingLeaves: leaveRequests.filter(r => r.status === "pending").length,
    approvedLeaves: leaveRequests.filter(r => r.status === "approved" && new Date(r.start_date) > new Date()).length,
    avgSalary: employees.length > 0
      ? employees.reduce((sum, e) => sum + (e.base_salary || 0), 0) / employees.filter(e => e.base_salary).length
      : 0,
    totalPayroll: employees.reduce((sum, e) => sum + (e.base_salary || 0), 0),
    attendanceRate: employees.filter(e => e.employment_status === "active").length > 0
      ? (attendanceRecords.filter(r => r.status === "present").length / employees.filter(e => e.employment_status === "active").length) * 100
      : 0,
    pendingReviews: performanceReviews.filter(r => !r.is_finalized).length,
    avgPerformanceRating: performanceReviews.length > 0
      ? performanceReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / performanceReviews.length
      : 0
  };

  // Dashboard widgets
  const recentLeaveRequests = leaveRequests
    .sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime())
    .slice(0, 5);

  const upcomingLeaves = leaveRequests
    .filter(r => r.status === "approved" && new Date(r.start_date) > new Date())
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 5);

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case "vacation": return "text-blue-600";
      case "sick": return "text-red-600";
      case "personal": return "text-purple-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 pb-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Employee Management Hub</h1>
          </div>

          {/* Global Search and Filters */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search employees by name, code, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="on_probation">On Probation</option>
                  <option value="suspended">Suspended</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
              <div>
                <select
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("directory")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "directory"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="w-4 h-4 mr-2" />
                Employee List ({analytics.totalEmployees})
              </button>
              <button
                onClick={() => setActiveTab("attendance")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "attendance"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Clock className="w-4 h-4 mr-2" />
                Attendance ({analytics.todayAttendance})
              </button>
              <button
                onClick={() => setActiveTab("leaves")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "leaves"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Leaves ({analytics.pendingLeaves})
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "performance"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Award className="w-4 h-4 mr-2" />
                Performance ({performanceReviews.length})
              </button>
              <button
                onClick={() => setActiveTab("payroll")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "payroll"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Payroll
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {/* Employee Directory Tab */}
            {activeTab === "directory" && (
              <div>
                {/* Action Buttons */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Employee
                    </button>
                    <button
                      onClick={() => {
                        const csv = generateCSV();
                        downloadCSV(csv, 'employees.csv');
                      }}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition inline-flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export All
                    </button>
                  </div>

                  {/* Bulk Actions */}
                  {selectedEmployeeIds.size > 0 && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-700">
                        {selectedEmployeeIds.size} selected
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setShowBulkActions(!showBulkActions)}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 transition inline-flex items-center"
                        >
                          Bulk Actions
                          <CheckCircle className="w-4 h-4 ml-1" />
                        </button>
                        {showBulkActions && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                            <button
                              onClick={() => {
                                handleBulkExport();
                                setShowBulkActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Export Selected
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Change Status</div>
                            <button
                              onClick={() => {
                                handleBulkStatusChange("active");
                                setShowBulkActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Set as Active
                            </button>
                            <button
                              onClick={() => {
                                handleBulkStatusChange("on_leave");
                                setShowBulkActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Set as On Leave
                            </button>
                            <button
                              onClick={() => {
                                handleBulkStatusChange("suspended");
                                setShowBulkActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            >
                              Suspend
                            </button>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={() => {
                                handleBulkDelete();
                                setShowBulkActions(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Deactivate Selected
                            </button>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedEmployeeIds(new Set())}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Employee Table */}
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-4">Loading employees...</p>
                    </div>
                  ) : filteredEmployees.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No employees found</p>
                      <p className="text-sm text-gray-400">Add your first employee to get started</p>
                    </div>
                  ) : (
                    <table className="w-full border-collapse">
                      <thead className="bg-blue-50">
                        <tr>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 border border-gray-300 bg-blue-100 w-12">
                            <input
                              type="checkbox"
                              checked={isAllSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = isSomeSelected;
                              }}
                              onChange={(e) => handleSelectAll(e.target.checked)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 w-16">S.#</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Job Title</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Department</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Absences</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Leaves Taken</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Remaining</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Performance</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Base Salary</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">OT Hours</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Bonus</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Commission</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Total Comp</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Deductions</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Net Pay</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {filteredEmployees.map((emp, index) => {
                          const dept = departments.find(d => d.id === emp.department_id);
                          const isSelected = selectedEmployeeIds.has(emp.id);

                          // Calculate employee-specific metrics
                          const empAbsences = attendanceRecords.filter(r =>
                            r.employee_id === emp.id && r.status === "absent"
                          ).length;

                          const empLeaves = leaveRequests.filter(r =>
                            r.employee_id === emp.id && r.status === "approved"
                          );
                          const leavesTaken = empLeaves.reduce((sum, leave) => sum + leave.total_days, 0);
                          const annualLeaveAllowance = 20; // Default annual leave days
                          const remainingLeaves = annualLeaveAllowance - leavesTaken;

                          const empPerformance = performanceReviews.find(r => r.employee_id === emp.id);
                          const performanceRating = empPerformance?.overall_rating || 0;

                          return (
                            <tr key={emp.id} className={`hover:bg-blue-50 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                              <td className="px-4 py-4 text-center border border-gray-300 bg-white">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => handleSelectEmployee(emp.id, e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 border border-gray-300 bg-white">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">{emp.employee_code}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">{emp.first_name} {emp.last_name}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">{emp.job_title || "-"}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">{dept ? dept.name : "-"}</td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white capitalize">{emp.employment_type.replace("_", " ")}</td>
                              <td className="px-6 py-4 border border-gray-300 bg-white">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(emp.employment_status)} capitalize`}>
                                  {emp.employment_status.replace("_", " ")}
                                </span>
                              </td>

                              {/* Absences */}
                              <td className="px-6 py-4 text-center border border-gray-300 bg-white">
                                <span className={`px-2 py-1 inline-flex text-sm font-bold rounded-full ${
                                  empAbsences === 0 ? 'bg-green-100 text-green-800' :
                                  empAbsences <= 2 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {empAbsences}
                                </span>
                              </td>

                              {/* Leaves Taken */}
                              <td className="px-6 py-4 text-center text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                                {leavesTaken} days
                              </td>

                              {/* Remaining Leaves */}
                              <td className="px-6 py-4 text-center border border-gray-300 bg-white">
                                <span className={`px-2 py-1 inline-flex text-sm font-bold rounded-full ${
                                  remainingLeaves >= 15 ? 'bg-green-100 text-green-800' :
                                  remainingLeaves >= 5 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {remainingLeaves} days
                                </span>
                              </td>

                              {/* Performance Rating */}
                              <td className="px-6 py-4 text-center border border-gray-300 bg-white">
                                {performanceRating > 0 ? (
                                  <div className="flex flex-col items-center">
                                    <div className="flex items-center space-x-1">
                                      {renderStars(performanceRating).slice(0, 5)}
                                    </div>
                                    <span className={`text-sm font-bold mt-1 ${getRatingColor(performanceRating)}`}>
                                      {performanceRating.toFixed(1)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No Review</span>
                                )}
                              </td>

                              {/* Base Salary */}
                              <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                                {emp.base_salary ? `$${emp.base_salary.toLocaleString()}` : "-"}
                              </td>

                              {/* OT Hours - Calculate from attendance records */}
                              <td className="px-6 py-4 text-center border border-gray-300 bg-white">
                                {(() => {
                                  const empAttendance = attendanceRecords.filter(r => r.employee_id === emp.id);
                                  const totalHours = empAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
                                  const standardHours = 8; // Standard work hours per day
                                  const overtimeHours = Math.max(0, totalHours - (empAttendance.length * standardHours));

                                  return overtimeHours > 0 ? (
                                    <span className="px-2 py-1 inline-flex text-sm font-bold rounded-full bg-orange-100 text-orange-800">
                                      {overtimeHours.toFixed(1)} hrs
                                    </span>
                                  ) : (
                                    <span className="text-sm text-gray-500">0 hrs</span>
                                  );
                                })()}
                              </td>

                              {/* Bonus Amount */}
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {emp.bonus_amount ? `$${emp.bonus_amount.toLocaleString()}` : "-"}
                              </td>

                              {/* Commission Rate */}
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {emp.commission_rate ? `${emp.commission_rate}%` : "-"}
                              </td>

                              {/* Total Compensation - Calculate sum */}
                              <td className="px-6 py-4 text-sm font-bold text-gray-900 border border-gray-300 bg-white">
                                {(() => {
                                  const baseSalary = emp.base_salary || 0;
                                  const bonus = emp.bonus_amount || 0;

                                  // Calculate overtime pay (assuming hourly_rate or derived from base_salary)
                                  const empAttendance = attendanceRecords.filter(r => r.employee_id === emp.id);
                                  const totalHours = empAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
                                  const standardHours = 8;
                                  const overtimeHours = Math.max(0, totalHours - (empAttendance.length * standardHours));
                                  const hourlyRate = emp.hourly_rate || (baseSalary / 2080); // 2080 work hours per year
                                  const overtimePay = overtimeHours * hourlyRate * 1.5; // 1.5x for overtime

                                  // Commission calculation (simplified - assume on base)
                                  const commissionAmount = emp.commission_rate ? (baseSalary * emp.commission_rate / 100) : 0;

                                  const totalComp = baseSalary + bonus + overtimePay + commissionAmount;

                                  return totalComp > 0 ? `$${totalComp.toLocaleString(undefined, {maximumFractionDigits: 0})}` : "-";
                                })()}
                              </td>

                              {/* Deductions - Calculate taxes and penalties */}
                              <td className="px-6 py-4 text-sm text-red-600 border border-gray-300 bg-white">
                                {(() => {
                                  const baseSalary = emp.base_salary || 0;

                                  // Tax calculation (simplified estimate based on filing status)
                                  const taxRate = emp.tax_filing_status === "married" ? 0.15 : 0.20; // Simplified tax rates
                                  const federalTax = baseSalary * taxRate;
                                  const additionalWithholding = emp.tax_additional_withholding || 0;

                                  // Absence penalty (simplified - $100 per absence)
                                  const absencePenalty = empAbsences * 100;

                                  const totalDeductions = federalTax + additionalWithholding + absencePenalty;

                                  return totalDeductions > 0 ? `-$${totalDeductions.toLocaleString(undefined, {maximumFractionDigits: 0})}` : "$0";
                                })()}
                              </td>

                              {/* Net Pay - Total Comp minus Deductions */}
                              <td className="px-6 py-4 text-sm font-bold text-green-600 border border-gray-300 bg-white">
                                {(() => {
                                  const baseSalary = emp.base_salary || 0;
                                  const bonus = emp.bonus_amount || 0;

                                  // Calculate overtime pay
                                  const empAttendance = attendanceRecords.filter(r => r.employee_id === emp.id);
                                  const totalHours = empAttendance.reduce((sum, record) => sum + (record.total_hours || 0), 0);
                                  const standardHours = 8;
                                  const overtimeHours = Math.max(0, totalHours - (empAttendance.length * standardHours));
                                  const hourlyRate = emp.hourly_rate || (baseSalary / 2080);
                                  const overtimePay = overtimeHours * hourlyRate * 1.5;

                                  // Commission
                                  const commissionAmount = emp.commission_rate ? (baseSalary * emp.commission_rate / 100) : 0;

                                  const totalComp = baseSalary + bonus + overtimePay + commissionAmount;

                                  // Deductions
                                  const taxRate = emp.tax_filing_status === "married" ? 0.15 : 0.20;
                                  const federalTax = baseSalary * taxRate;
                                  const additionalWithholding = emp.tax_additional_withholding || 0;
                                  const absencePenalty = empAbsences * 100;
                                  const totalDeductions = federalTax + additionalWithholding + absencePenalty;

                                  const netPay = totalComp - totalDeductions;

                                  return netPay > 0 ? `$${netPay.toLocaleString(undefined, {maximumFractionDigits: 0})}` : "-";
                                })()}
                              </td>

                              <td className="px-6 py-4 border border-gray-300 bg-white">
                                <div className="flex items-center space-x-1">
                                  <Link
                                    href={`/employees/${emp.id}`}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                                    title="View Profile"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setSelectedEmployee(emp);
                                      setFormData(emp);
                                      setShowEditModal(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition"
                                    title="Edit"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEmployee(emp.id)}
                                    className="p-1.5 text-red-600 hover:bg-red-100 rounded transition"
                                    title="Deactivate"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
                </div>

                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No attendance records for today</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employee</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Clock In</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Clock Out</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Total Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                            {getEmployeeName(record.employee_id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {new Date(record.attendance_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {record.clock_in ? new Date(record.clock_in).toLocaleTimeString() : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {record.clock_out ? new Date(record.clock_out).toLocaleTimeString() : "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {record.total_hours ? `${record.total_hours.toFixed(2)} hrs` : "-"}
                          </td>
                          <td className="px-6 py-4 border border-gray-300 bg-white">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              record.status === "present" ? "bg-green-100 text-green-800" :
                              record.status === "absent" ? "bg-red-100 text-red-800" :
                              "bg-gray-100 text-gray-800"
                            } capitalize`}>
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Leave Management Tab */}
            {activeTab === "leaves" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Leave Requests</h3>
                </div>

                {leaveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No leave requests found</p>
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
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {leaveRequests.map((leave) => (
                        <tr key={leave.id} className="hover:bg-blue-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                            {getEmployeeName(leave.employee_id)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white capitalize">
                            {leave.leave_type}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {leave.total_days}
                          </td>
                          <td className="px-6 py-4 border border-gray-300 bg-white">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              leave.status === "approved" ? "bg-green-100 text-green-800" :
                              leave.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            } capitalize`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {leave.reason || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Payroll Tab */}
            {activeTab === "payroll" && (
              <div className="flex flex-col items-center justify-center py-16 px-6">
                {/* Icon and Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                    <DollarSign className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Payroll Processing</h3>
                  <p className="text-gray-600 max-w-2xl mx-auto">
                    Access the full payroll system with integrated attendance hours, bonuses, tax calculations, and comprehensive reports.
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 w-full max-w-5xl">
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Attendance Integration</h4>
                    <p className="text-xs text-gray-600">Auto-calculated from clock-in/out data</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Bonus Tracking</h4>
                    <p className="text-xs text-gray-600">Approved bonuses auto-added</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Tax Calculations</h4>
                    <p className="text-xs text-gray-600">Automatic tax & deduction processing</p>
                  </div>
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                    <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">Pay Period Selection</h4>
                    <p className="text-xs text-gray-600">Flexible date range filtering</p>
                  </div>
                </div>

                {/* Payroll Summary Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-8 w-full max-w-5xl">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">Quick Payroll Overview</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Users className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalEmployees}</p>
                      <p className="text-xs text-gray-600">Total Employees</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-green-600">${analytics.totalPayroll.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      <p className="text-xs text-gray-600">Total Payroll</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-600">${analytics.avgSalary.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      <p className="text-xs text-gray-600">Avg Salary</p>
                    </div>
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-purple-600">{analytics.activeEmployees}</p>
                      <p className="text-xs text-gray-600">Active</p>
                    </div>
                  </div>
                </div>

                {/* Call to Action Button */}
                <Link
                  href="/payroll"
                  className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <DollarSign className="w-6 h-6 mr-2" />
                  Open Full Payroll System
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition" />
                </Link>

                <p className="text-sm text-gray-500 mt-4">
                  Process payroll with pay period selection, detailed breakdowns, and export capabilities
                </p>
              </div>
            )}

            {/* Performance Management Tab */}
            {activeTab === "performance" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Performance Reviews</h3>
                </div>

                {performanceReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No performance reviews found</p>
                    <p className="text-sm text-gray-400">Performance reviews will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {performanceReviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">
                              {getEmployeeName(review.employee_id)}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Review Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Reviewed by: {getEmployeeName(review.reviewer_id)} on {new Date(review.review_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              review.is_finalized ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {review.is_finalized ? "Finalized" : "Draft"}
                            </span>
                          </div>
                        </div>

                        {/* Ratings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(review.overall_rating)}</div>
                              <span className={`text-lg font-bold ${getRatingColor(review.overall_rating)}`}>
                                {review.overall_rating?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Goals</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(review.goals_rating)}</div>
                              <span className={`text-lg font-bold ${getRatingColor(review.goals_rating)}`}>
                                {review.goals_rating?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Skills</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(review.skills_rating)}</div>
                              <span className={`text-lg font-bold ${getRatingColor(review.skills_rating)}`}>
                                {review.skills_rating?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">Attendance</p>
                            <div className="flex items-center space-x-2">
                              <div className="flex">{renderStars(review.attendance_rating)}</div>
                              <span className={`text-lg font-bold ${getRatingColor(review.attendance_rating)}`}>
                                {review.attendance_rating?.toFixed(1) || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Comments and Feedback */}
                        {review.comments && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">Comments</p>
                            <p className="text-sm text-gray-600 mt-1">{review.comments}</p>
                          </div>
                        )}
                        {review.strengths && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">Strengths</p>
                            <p className="text-sm text-gray-600 mt-1">{review.strengths}</p>
                          </div>
                        )}
                        {review.areas_for_improvement && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-900">Areas for Improvement</p>
                            <p className="text-sm text-gray-600 mt-1">{review.areas_for_improvement}</p>
                          </div>
                        )}
                        {review.goals_next_period && (
                          <div>
                            <p className="text-sm font-medium text-gray-900">Goals for Next Period</p>
                            <p className="text-sm text-gray-600 mt-1">{review.goals_next_period}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </main>

      {/* Add Employee Modal - Simplified for space */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-semibold">Add New Employee</h3>
              <button onClick={() => {
                setShowAddModal(false);
                setFormTab("basic");
                setFormData({});
              }}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee Code *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.employee_code || ""}
                    onChange={(e) => setFormData({...formData, employee_code: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.first_name || ""}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.last_name || ""}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Work Email</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={formData.work_email || ""}
                    onChange={(e) => setFormData({...formData, work_email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type *</label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.employment_type || ""}
                    onChange={(e) => setFormData({...formData, employment_type: e.target.value})}
                  >
                    <option value="">Select...</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hire Date *</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.hire_date || ""}
                    onChange={(e) => setFormData({...formData, hire_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({});
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Employee Modal - Simplified */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-semibold">Employee Details</h3>
              <button onClick={() => setShowViewModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2">
                  {selectedEmployee.first_name} {selectedEmployee.last_name}
                </h4>
                <p className="text-gray-600">{selectedEmployee.employee_code}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{selectedEmployee.work_email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{selectedEmployee.work_phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Title</p>
                  <p className="font-medium">{selectedEmployee.job_title || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employment Type</p>
                  <p className="font-medium capitalize">{selectedEmployee.employment_type.replace("_", " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedEmployee.employment_status)} capitalize`}>
                    {selectedEmployee.employment_status.replace("_", " ")}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Hire Date</p>
                  <p className="font-medium">{new Date(selectedEmployee.hire_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
