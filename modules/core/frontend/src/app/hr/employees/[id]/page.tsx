"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Users,
  ArrowLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  DollarSign,
  Award,
  Clock,
  FileText,
  GraduationCap,
  Building2,
  User,
  CreditCard,
  TrendingUp,
  Activity,
  Star,
  CheckCircle,
  XCircle,
  AlertCircle,
  Key,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import Navigation from "@/components/hr/Navigation";

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
  date_of_birth?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_photo_url?: string;
}

interface Department {
  id: string;
  department_code: string;
  name: string;
  description?: string;
  parent_department_id?: string;
  department_head_id?: string;
  cost_center?: string;
  location?: string;
  is_active: boolean;
  created_at: string;
}

interface Payslip {
  id: string;
  employee_id: string;
  payroll_run_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  gross_pay: number;
  net_pay: number;
  total_deductions: number;
  total_taxes: number;
  overtime_hours?: number;
  overtime_pay?: number;
  bonus_amount?: number;
  created_at: string;
}

interface SalaryChange {
  id: string;
  employee_id: string;
  effective_date: string;
  old_salary?: number;
  new_salary: number;
  change_reason?: string;
  change_type: string;
  approved_by?: string;
  created_at: string;
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
}

interface EmployeeCredential {
  has_credentials: boolean;
  id?: string;
  username?: string;
  is_active?: boolean;
  last_login?: string;
  password_changed_at?: string;
  must_change_password?: boolean;
  failed_login_attempts?: number;
  is_locked?: boolean;
  locked_until?: string;
  created_at?: string;
  message?: string;
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [activeTab, setActiveTab] = useState<"overview" | "employment" | "compensation" | "leaves" | "attendance" | "performance" | "training">("overview");
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [salaryChanges, setSalaryChanges] = useState<SalaryChange[]>([]);
  const [credentials, setCredentials] = useState<EmployeeCredential | null>(null);
  const [showCredentialModal, setShowCredentialModal] = useState(false);
  const [newCredentials, setNewCredentials] = useState<{username: string, password: string} | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployeeData();
  }, [employeeId]);

  const loadEmployeeData = async () => {
    try {
      const [empRes, leaveReqRes, leaveBalRes, attRes, perfRes, payslipRes, credRes] = await Promise.all([
        fetch(`/api/hr/employees/${employeeId}`),
        fetch(`/api/hr/leave-requests?employee_id=${employeeId}`),
        fetch(`/api/hr/leave-balances?employee_id=${employeeId}`),
        fetch(`/api/hr/attendance?employee_id=${employeeId}`),
        fetch(`/api/hr/performance-reviews?employee_id=${employeeId}`),
        fetch(`/api/hr/payslips?employee_id=${employeeId}`),
        fetch(`/api/hr/employees/${employeeId}/credentials`),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData);

        // Load department if employee has one
        if (empData.department_id) {
          const deptRes = await fetch(`/api/hr/departments/${empData.department_id}`);
          if (deptRes.ok) {
            setDepartment(await deptRes.json());
          }
        }
      }

      if (leaveReqRes.ok) setLeaveRequests(await leaveReqRes.json());
      if (leaveBalRes.ok) setLeaveBalances(await leaveBalRes.json());
      if (attRes.ok) setAttendanceRecords(await attRes.json());
      if (perfRes.ok) setPerformanceReviews(await perfRes.json());
      if (credRes.ok) setCredentials(await credRes.json());
      if (payslipRes.ok) {
        const payslipData = await payslipRes.json();
        setPayslips(payslipData);

        // Generate salary change history from payslips (if we have multiple with different gross pay)
        // This is a placeholder - ideally you'd have a dedicated salary_changes table
        const changes: SalaryChange[] = [];
        if (employee?.base_salary) {
          changes.push({
            id: `current-${employeeId}`,
            employee_id: employeeId,
            effective_date: employee.hire_date,
            new_salary: employee.base_salary,
            change_type: "initial",
            change_reason: "Initial hire",
            created_at: employee.hire_date,
          });
        }
        setSalaryChanges(changes);
      }
    } catch (err) {
      console.error("Failed to load employee data", err);
    } finally {
      setLoading(false);
    }
  };

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

  const renderStars = (rating?: number) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
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

  // Credential Management Functions
  const handleCreateCredentials = async () => {
    setCredentialLoading(true);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/credentials`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setNewCredentials({ username: data.username, password: data.password });
        setShowCredentialModal(true);
        // Reload credentials to update state
        const credRes = await fetch(`/api/hr/employees/${employeeId}/credentials`);
        if (credRes.ok) setCredentials(await credRes.json());
      } else {
        const error = await response.json();
        alert(`Failed to create credentials: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to create credentials", err);
      alert("Failed to create credentials");
    } finally {
      setCredentialLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!confirm("Are you sure you want to reset the password? A new password will be generated.")) return;

    setCredentialLoading(true);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/credentials/reset-password`, {
        method: 'PUT',
      });

      if (response.ok) {
        const data = await response.json();
        setNewCredentials({ username: credentials?.username || '', password: data.new_password });
        setShowCredentialModal(true);
        // Reload credentials
        const credRes = await fetch(`/api/hr/employees/${employeeId}/credentials`);
        if (credRes.ok) setCredentials(await credRes.json());
      } else {
        const error = await response.json();
        alert(`Failed to reset password: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to reset password", err);
      alert("Failed to reset password");
    } finally {
      setCredentialLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = !credentials?.is_active;
    const action = newStatus ? "activate" : "deactivate";

    if (!confirm(`Are you sure you want to ${action} these credentials?`)) return;

    setCredentialLoading(true);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/credentials/toggle-status?is_active=${newStatus}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Reload credentials
        const credRes = await fetch(`/api/hr/employees/${employeeId}/credentials`);
        if (credRes.ok) setCredentials(await credRes.json());
        alert(`Credentials ${action}d successfully`);
      } else {
        const error = await response.json();
        alert(`Failed to ${action} credentials: ${error.detail}`);
      }
    } catch (err) {
      console.error(`Failed to ${action} credentials`, err);
      alert(`Failed to ${action} credentials`);
    } finally {
      setCredentialLoading(false);
    }
  };

  const handleDeleteCredentials = async () => {
    if (!confirm("Are you sure you want to delete these credentials? This action cannot be undone.")) return;

    setCredentialLoading(true);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/credentials`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCredentials({ has_credentials: false, message: "No credentials found" });
        alert("Credentials deleted successfully");
      } else {
        const error = await response.json();
        alert(`Failed to delete credentials: ${error.detail}`);
      }
    } catch (err) {
      console.error("Failed to delete credentials", err);
      alert("Failed to delete credentials");
    } finally {
      setCredentialLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Calculate statistics
  const stats = {
    totalLeaves: leaveRequests.length,
    pendingLeaves: leaveRequests.filter(r => r.status === "pending").length,
    approvedLeaves: leaveRequests.filter(r => r.status === "approved").length,
    totalAttendance: attendanceRecords.length,
    presentDays: attendanceRecords.filter(r => r.status === "present").length,
    absentDays: attendanceRecords.filter(r => r.status === "absent").length,
    avgPerformanceRating: performanceReviews.length > 0
      ? performanceReviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / performanceReviews.length
      : 0,
    totalReviews: performanceReviews.length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200">
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading employee profile...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-200">
        <main className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Employee not found</p>
            <button
              onClick={() => router.push("/hr/employees")}
              className="text-blue-600 hover:text-blue-800"
            >
              Return to Employee Hub
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-t-lg shadow">
          {/* Header with Back Button */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => router.push("/hr/employees")}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Employee Hub
            </button>

            {/* Enhanced Profile Header */}
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {employee.profile_photo_url ? (
                  <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white">
                    <img
                      src={employee.profile_photo_url}
                      alt={`${employee.first_name} ${employee.last_name}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Employee Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {employee.first_name} {employee.middle_name && `${employee.middle_name} `}{employee.last_name}
                    </h1>

                    <div className="flex items-center gap-4 mt-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.employment_status)} capitalize`}>
                        {employee.employment_status.replace("_", " ")}
                      </span>
                      <span className="text-sm text-gray-500">
                        {employee.employee_code}
                      </span>
                    </div>
                  </div>

                  {/* Edit Button Only */}
                  <button
                    onClick={() => router.push(`/hr/employees/${employeeId}/edit`)}
                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 mt-5">
                  <div className="flex items-center text-sm">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Departments:</span>
                    <span className="ml-2 font-medium text-gray-900">{department?.name || "Not Assigned"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Office Location:</span>
                    <span className="ml-2 font-medium text-gray-900">{employee.office_location || "Not Set"}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Employed for:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Reports To:</span>
                    <span className="ml-2 font-medium text-blue-600 cursor-pointer hover:underline">
                      {/* This should link to the reporting manager's profile */}
                      Not Set
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                  {employee.work_email && (
                    <a
                      href={`mailto:${employee.work_email}`}
                      className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition"
                    >
                      <Mail className="w-4 h-4 mr-1.5" />
                      {employee.work_email}
                    </a>
                  )}
                  {employee.work_phone && (
                    <a
                      href={`tel:${employee.work_phone}`}
                      className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition"
                    >
                      <Phone className="w-4 h-4 mr-1.5" />
                      {employee.work_phone}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex px-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <User className="w-4 h-4 mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("employment")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "employment"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Employment
              </button>
              <button
                onClick={() => setActiveTab("compensation")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "compensation"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Compensation
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
                Leaves ({leaveRequests.length})
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
                Attendance ({attendanceRecords.length})
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
                onClick={() => setActiveTab("training")}
                className={`px-4 py-4 text-sm font-medium border-b-2 transition flex items-center whitespace-nowrap ${
                  activeTab === "training"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Training
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="min-h-[500px]">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Personal Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Work Email</p>
                          <p className="text-sm font-medium">{employee.work_email || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Personal Email</p>
                          <p className="text-sm font-medium">{employee.personal_email || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Work Phone</p>
                          <p className="text-sm font-medium">{employee.work_phone || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Personal Phone</p>
                          <p className="text-sm font-medium">{employee.personal_phone || "-"}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Address</p>
                          <p className="text-sm font-medium">
                            {employee.address ? `${employee.address}, ${employee.city}, ${employee.state} ${employee.zip_code}` : "-"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-3" />
                        <div>
                          <p className="text-xs text-gray-500">Date of Birth</p>
                          <p className="text-sm font-medium">
                            {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                      Emergency Contact
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Contact Name</p>
                        <p className="text-sm font-medium">{employee.emergency_contact_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Contact Phone</p>
                        <p className="text-sm font-medium">{employee.emergency_contact_phone || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Relationship</p>
                        <p className="text-sm font-medium capitalize">{employee.emergency_contact_relationship || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Employment Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-purple-600" />
                      Employment Summary
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Job Title</p>
                        <p className="text-sm font-medium">{employee.job_title || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Job Level</p>
                        <p className="text-sm font-medium">{employee.job_level || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Employment Type</p>
                        <p className="text-sm font-medium capitalize">{employee.employment_type.replace("_", " ")}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Hire Date</p>
                        <p className="text-sm font-medium">{new Date(employee.hire_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Office Location</p>
                        <p className="text-sm font-medium">{employee.office_location || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Work Arrangement</p>
                        <p className="text-sm font-medium capitalize">{employee.work_arrangement?.replace("_", " ") || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Compensation Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Compensation Summary
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Base Salary</p>
                        <p className="text-lg font-bold text-green-600">
                          ${employee.base_salary?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Pay Frequency</p>
                        <p className="text-sm font-medium capitalize">{employee.pay_frequency?.replace("_", " ") || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Bonus Amount</p>
                        <p className="text-sm font-medium">${employee.bonus_amount?.toLocaleString() || "0"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Overtime Eligible</p>
                        <p className="text-sm font-medium">{employee.overtime_eligible ? "Yes" : "No"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard Credentials */}
                  <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <Shield className="w-5 h-5 mr-2 text-indigo-600" />
                      Dashboard Credentials
                    </h3>

                    {credentials?.has_credentials ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Username</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium">{credentials.username}</p>
                              <button
                                onClick={() => copyToClipboard(credentials.username || '')}
                                className="text-gray-400 hover:text-blue-600 transition"
                                title="Copy username"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Status</p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              credentials.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                            }`}>
                              {credentials.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Last Login</p>
                            <p className="text-sm font-medium">
                              {credentials.last_login ? new Date(credentials.last_login).toLocaleString() : "Never"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Password Changed</p>
                            <p className="text-sm font-medium">
                              {credentials.password_changed_at ? new Date(credentials.password_changed_at).toLocaleString() : "Never"}
                            </p>
                          </div>
                          {credentials.is_locked && (
                            <div className="md:col-span-2">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-xs text-red-700 flex items-center">
                                  <Lock className="w-4 h-4 mr-2" />
                                  Account is locked until {credentials.locked_until ? new Date(credentials.locked_until).toLocaleString() : 'unknown'}
                                </p>
                              </div>
                            </div>
                          )}
                          {credentials.must_change_password && (
                            <div className="md:col-span-2">
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <p className="text-xs text-yellow-700 flex items-center">
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Employee must change password on next login
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-2">
                          <button
                            onClick={handleResetPassword}
                            disabled={credentialLoading}
                            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reset Password</span>
                          </button>
                          <button
                            onClick={handleToggleStatus}
                            disabled={credentialLoading}
                            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition text-sm disabled:opacity-50 ${
                              credentials.is_active
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                          >
                            {credentials.is_active ? (
                              <>
                                <Lock className="w-4 h-4" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <Unlock className="w-4 h-4" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={handleDeleteCredentials}
                            disabled={credentialLoading}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition text-sm disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-600 mb-4">No dashboard credentials created yet</p>
                        <button
                          onClick={handleCreateCredentials}
                          disabled={credentialLoading}
                          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm disabled:opacity-50 mx-auto"
                        >
                          <Key className="w-4 h-4" />
                          <span>Create Dashboard Credentials</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Employment Tab */}
            {activeTab === "employment" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Employment Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Employee Code</p>
                          <p className="font-medium text-gray-900">{employee.employee_code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(employee.employment_status)} capitalize`}>
                            {employee.employment_status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Employment Type</p>
                          <p className="font-medium text-gray-900 capitalize">{employee.employment_type.replace("_", " ")}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Job Level</p>
                          <p className="font-medium text-gray-900">{employee.job_level || "-"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Job Title</p>
                        <p className="font-medium text-gray-900">{employee.job_title || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Department</p>
                        <p className="font-medium text-gray-900">{department?.name || "-"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Hire Date</p>
                          <p className="font-medium text-gray-900">{new Date(employee.hire_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Tenure</p>
                          <p className="font-medium text-gray-900">
                            {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Office Location</p>
                          <p className="font-medium text-gray-900">{employee.office_location || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Work Arrangement</p>
                          <p className="font-medium text-gray-900 capitalize">{employee.work_arrangement?.replace("_", " ") || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Department Information</h3>
                    {department ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500">Department Name</p>
                          <p className="font-medium text-gray-900">{department.name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Department Code</p>
                          <p className="font-medium text-gray-900">{department.department_code}</p>
                        </div>
                        {department.description && (
                          <div>
                            <p className="text-sm text-gray-500">Description</p>
                            <p className="font-medium text-gray-900">{department.description}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500">No department assigned</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Compensation Tab */}
            {activeTab === "compensation" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Salary Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      Salary Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Base Salary (Annual)</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${employee.base_salary?.toLocaleString() || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Pay Frequency</p>
                          <p className="font-medium text-gray-900 capitalize">{employee.pay_frequency?.replace("_", " ") || "-"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Currency</p>
                          <p className="font-medium text-gray-900">{employee.currency || "USD"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Hourly Rate</p>
                        <p className="font-medium text-gray-900">${employee.hourly_rate?.toLocaleString() || "N/A"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Bonus Amount</p>
                          <p className="font-medium text-gray-900">${employee.bonus_amount?.toLocaleString() || "0"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Commission Rate</p>
                          <p className="font-medium text-gray-900">{employee.commission_rate ? `${employee.commission_rate}%` : "N/A"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overtime Eligible</p>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.overtime_eligible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                        }`}>
                          {employee.overtime_eligible ? "Yes" : "No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Banking Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                      Banking Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Bank Name</p>
                        <p className="font-medium text-gray-900">{employee.bank_name || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Type</p>
                        <p className="font-medium text-gray-900 capitalize">{employee.bank_account_type || "-"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Account Number</p>
                        <p className="font-medium text-gray-900">
                          {employee.bank_account_number ? `****${employee.bank_account_number.slice(-4)}` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Routing Number</p>
                        <p className="font-medium text-gray-900">{employee.bank_routing_number || "-"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Tax Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Tax ID</p>
                        <p className="font-medium text-gray-900">
                          {employee.tax_id ? `***-**-${employee.tax_id.slice(-4)}` : "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Filing Status</p>
                        <p className="font-medium text-gray-900 capitalize">{employee.tax_filing_status || "-"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Allowances</p>
                          <p className="font-medium text-gray-900">{employee.tax_allowances || "0"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Additional Withholding</p>
                          <p className="font-medium text-gray-900">${employee.tax_additional_withholding || "0"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* YTD Earnings Summary */}
                {payslips.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                      Year-to-Date Earnings Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-700 mb-1">YTD Gross Pay</p>
                        <p className="text-2xl font-bold text-green-800">
                          ${payslips.reduce((sum, p) => sum + p.gross_pay, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-700 mb-1">YTD Net Pay</p>
                        <p className="text-2xl font-bold text-blue-800">
                          ${payslips.reduce((sum, p) => sum + p.net_pay, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-700 mb-1">YTD Taxes</p>
                        <p className="text-2xl font-bold text-red-800">
                          ${payslips.reduce((sum, p) => sum + p.total_taxes, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
                        <p className="text-sm text-purple-700 mb-1">YTD Deductions</p>
                        <p className="text-2xl font-bold text-purple-800">
                          ${payslips.reduce((sum, p) => sum + p.total_deductions, 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payroll History */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-indigo-600" />
                    Payroll History
                  </h3>
                  {payslips.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                      <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">No payroll records found</p>
                      <p className="text-sm text-gray-400">Payslips will appear here after payroll processing</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Pay Period</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Pay Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Gross Pay</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Taxes</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Deductions</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Net Pay</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Overtime</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Bonus</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {payslips.slice().reverse().map((payslip) => (
                            <tr key={payslip.id} className="hover:bg-blue-50 transition">
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {new Date(payslip.pay_period_start).toLocaleDateString()} - {new Date(payslip.pay_period_end).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {new Date(payslip.pay_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm font-semibold text-green-700 border border-gray-300 bg-white">
                                ${payslip.gross_pay.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-red-700 border border-gray-300 bg-white">
                                ${payslip.total_taxes.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-orange-700 border border-gray-300 bg-white">
                                ${payslip.total_deductions.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-blue-700 border border-gray-300 bg-white">
                                ${payslip.net_pay.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {payslip.overtime_hours ? `${payslip.overtime_hours} hrs ($${payslip.overtime_pay?.toLocaleString()})` : "-"}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                                {payslip.bonus_amount ? `$${payslip.bonus_amount.toLocaleString()}` : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Salary Change History */}
                {salaryChanges.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                      Salary Change History
                    </h3>
                    <div className="space-y-3">
                      {salaryChanges.map((change, index) => (
                        <div key={change.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-2 h-2 rounded-full ${
                                  change.change_type === "promotion" ? "bg-green-500" :
                                  change.change_type === "adjustment" ? "bg-blue-500" :
                                  change.change_type === "initial" ? "bg-gray-500" :
                                  "bg-yellow-500"
                                }`}></div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-900 capitalize">
                                    {change.change_type.replace("_", " ")}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Effective: {new Date(change.effective_date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              {change.change_reason && (
                                <p className="text-sm text-gray-600 mt-2">{change.change_reason}</p>
                              )}
                              {change.approved_by && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Approved by: {change.approved_by}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {change.old_salary && (
                                <p className="text-xs text-gray-500 line-through">
                                  ${change.old_salary.toLocaleString()}
                                </p>
                              )}
                              <p className="text-lg font-bold text-green-600">
                                ${change.new_salary.toLocaleString()}
                              </p>
                              {change.old_salary && (
                                <p className={`text-xs font-semibold mt-1 ${
                                  change.new_salary > change.old_salary ? "text-green-600" : "text-red-600"
                                }`}>
                                  {change.new_salary > change.old_salary ? "+" : ""}
                                  ${(change.new_salary - change.old_salary).toLocaleString()}
                                  ({((change.new_salary - change.old_salary) / change.old_salary * 100).toFixed(1)}%)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leaves Tab */}
            {activeTab === "leaves" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Leave Balances</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {leaveBalances.map((balance) => (
                      <div key={balance.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-gray-900 capitalize mb-2">{balance.leave_type}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-gray-500">Allocated</p>
                            <p className="font-semibold">{balance.total_allocated} days</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Used</p>
                            <p className="font-semibold text-red-600">{balance.total_used} days</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pending</p>
                            <p className="font-semibold text-yellow-600">{balance.total_pending} days</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Available</p>
                            <p className="font-semibold text-green-600">{balance.total_available} days</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Leave History</h3>
                {leaveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No leave requests found</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-blue-50">
                      <tr>
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
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white capitalize">{leave.leave_type}</td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {new Date(leave.start_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                            {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">{leave.total_days}</td>
                          <td className="px-6 py-4 border border-gray-300 bg-white">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              leave.status === "approved" ? "bg-green-100 text-green-800" :
                              leave.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            } capitalize`}>
                              {leave.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">{leave.reason || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Attendance Tab */}
            {activeTab === "attendance" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Attendance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Days</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalAttendance}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Present</p>
                      <p className="text-2xl font-bold text-green-600">{stats.presentDays}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Absent</p>
                      <p className="text-2xl font-bold text-red-600">{stats.absentDays}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Attendance Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.totalAttendance > 0 ? ((stats.presentDays / stats.totalAttendance) * 100).toFixed(0) : 0}%
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Attendance Records</h3>
                {attendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No attendance records found</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Clock In</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Clock Out</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Total Hours</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {attendanceRecords.slice(0, 30).map((record) => (
                        <tr key={record.id} className="hover:bg-blue-50 transition">
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

            {/* Performance Tab */}
            {activeTab === "performance" && (
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Performance Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Reviews</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Average Rating</p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold text-blue-600">
                          {stats.avgPerformanceRating > 0 ? stats.avgPerformanceRating.toFixed(1) : "N/A"}
                        </p>
                        <div className="flex">{renderStars(stats.avgPerformanceRating)}</div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Latest Review</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {performanceReviews.length > 0
                          ? new Date(performanceReviews[0].review_date).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Performance Review History</h3>
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
                            <p className="text-sm text-gray-600">
                              Review Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              Reviewed on: {new Date(review.review_date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            review.is_finalized ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {review.is_finalized ? "Finalized" : "Draft"}
                          </span>
                        </div>

                        {/* Ratings */}
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

                        {/* Comments */}
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

            {/* Training Tab */}
            {activeTab === "training" && (
              <div className="p-6">
                <div className="text-center py-12">
                  <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Training & Development</p>
                  <p className="text-sm text-gray-400">Training records and certifications will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Credential Modal */}
      {showCredentialModal && newCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <Shield className="w-6 h-6 mr-2 text-indigo-600" />
                Dashboard Credentials Created
              </h3>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This password will only be shown once. Please save it securely or share it with the employee immediately.
                </p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Username</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newCredentials.username}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(newCredentials.username)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Copy username"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
                <div className="flex items-center space-x-2">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newCredentials.password}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(newCredentials.password)}
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    title="Copy password"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The employee will be required to change this password on their first login for security purposes.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setShowCredentialModal(false);
                  setNewCredentials(null);
                  setShowPassword(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
