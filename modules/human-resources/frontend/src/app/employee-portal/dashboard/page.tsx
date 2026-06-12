"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import TimeOffTab from "@/components/TimeOffTab";
import CompensationTab from "@/components/CompensationTab";
import BankingInformationTab from "@/components/BankingInformationTab";
import TeamsTab from "@/components/TeamsTab";
import PerformanceTab from "@/components/PerformanceTab";
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  Briefcase,
  Receipt,
  Activity,
  Users,
  TrendingUp,
  FileText,
  Settings,
  ChevronRight,
  Mail,
  MapPin,
  Trash2,
  Edit,
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  work_email?: string;
  job_title?: string;
  department_id?: string;
  employment_status: string;
  hire_date: string;
  base_salary?: number;
}

interface LeaveBalance {
  leave_type: string;
  total_allocated: number;
  total_used: number;
  total_available: number;
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

interface Announcement {
  id: number;
  title: string;
  message: string;
  date: string;
  type: string;
}

interface Expense {
  id: string;
  amount: number;
  status: string;
}

interface TimesheetSummary {
  currentWeekHours: number;
  status: "draft" | "submitted" | "approved";
}

export default function EmployeePortalDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [clockingInOut, setClockingInOut] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [timesheetSummary, setTimesheetSummary] = useState<TimesheetSummary>({
    currentWeekHours: 0,
    status: "draft",
  });
  const [payslips, setPayslips] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    // Check if logged in
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/employee-portal/login");
      return;
    }

    loadEmployeeData(employeeId);

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [router]);

  const loadEmployeeData = async (employeeId: string) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [empRes, leaveRes, balanceRes, attendanceRes, payslipsRes] = await Promise.all([
        fetch(`/api/hr/employees`),
        fetch(`/api/hr/leave-requests`),
        fetch(`/api/hr/leave-balances?employee_id=${employeeId}`),
        fetch(`/api/hr/attendance?employee_id=${employeeId}&start_date=${today}&end_date=${today}`),
        fetch(`/api/hr/payslips?employee_id=${employeeId}`),
      ]);

      if (empRes.ok) {
        const employees = await empRes.json();
        const emp = employees.find((e: Employee) => e.id === employeeId);
        setEmployee(emp);
      }

      if (leaveRes.ok) {
        const allLeaves = await leaveRes.json();
        const myLeaves = allLeaves.filter((l: LeaveRequest) => l.employee_id === employeeId);
        setLeaveRequests(myLeaves);
      }

      if (balanceRes.ok) {
        const balances = await balanceRes.json();
        setLeaveBalance(balances);
      }

      if (attendanceRes.ok) {
        const records = await attendanceRes.json();
        setTodayAttendance(records.length > 0 ? records[0] : null);
      }

      if (payslipsRes.ok) {
        const payslipsData = await payslipsRes.json();
        setPayslips(payslipsData);
      }

      // Load expenses (mock data for now)
      const mockExpenses: Expense[] = [
        { id: "1", amount: 125.50, status: "pending" },
        { id: "2", amount: 450.00, status: "approved" },
        { id: "3", amount: 89.25, status: "pending" },
        { id: "4", amount: 220.00, status: "reimbursed" },
      ];
      setExpenses(mockExpenses);

      // Load timesheet summary (mock data for now)
      const mockTimesheet: TimesheetSummary = {
        currentWeekHours: 35.5,
        status: "draft",
      };
      setTimesheetSummary(mockTimesheet);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    if (!employee) return;

    setClockingInOut(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const now = new Date().toISOString();

      const res = await fetch("/api/hr/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employee.id,
          attendance_date: today,
          clock_in: now,
          status: "present",
        }),
      });

      if (res.ok) {
        const record = await res.json();
        setTodayAttendance(record);
      } else {
        const errorData = await res.json();
        console.error("Clock in failed:", errorData);
      }
    } catch (err) {
      console.error("Clock in failed", err);
    } finally {
      setClockingInOut(false);
    }
  };

  const handleClockOut = async () => {
    if (!employee || !todayAttendance) return;

    setClockingInOut(true);
    try {
      const now = new Date().toISOString();

      const res = await fetch(`/api/hr/attendance/${todayAttendance.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clock_out: now,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTodayAttendance(updated);
      } else {
        const errorData = await res.json();
        console.error("Clock out failed:", errorData);
      }
    } catch (err) {
      console.error("Clock out failed", err);
    } finally {
      setClockingInOut(false);
    }
  };

  const getWorkDuration = () => {
    if (!todayAttendance?.clock_in) return "0h 0m";

    const clockIn = new Date(todayAttendance.clock_in);
    const clockOut = todayAttendance.clock_out ? new Date(todayAttendance.clock_out) : new Date();
    const diff = clockOut.getTime() - clockIn.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const calculateEmploymentDuration = (hireDate: string) => {
    const hire = new Date(hireDate);
    const now = new Date();
    const diffMs = now.getTime() - hire.getTime();
    const years = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diffMs % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));

    if (years > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
    }
    return `${months} month${months !== 1 ? 's' : ''}`;
  };

  const announcements: Announcement[] = [
    {
      id: 1,
      title: "Company Holiday - Independence Day",
      message: "Office will be closed on July 4th for Independence Day celebration.",
      date: "2026-07-01",
      type: "holiday",
    },
    {
      id: 2,
      title: "Performance Review Period",
      message: "Annual performance reviews will be conducted from April 15-30.",
      date: "2026-04-08",
      type: "important",
    },
    {
      id: 3,
      title: "New Health Insurance Plans Available",
      message: "Updated health insurance options are now available. Check your benefits portal.",
      date: "2026-04-05",
      type: "info",
    },
  ];

  const getAnnouncementColor = (type: string) => {
    switch (type) {
      case "holiday": return "border-l-4 border-l-green-500";
      case "important": return "border-l-4 border-l-red-500";
      default: return "border-l-4 border-l-blue-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const tabs = [
    { id: "announcements", label: "Announcements" },
    { id: "time-off", label: "Time Off" },
    { id: "banking", label: "Banking Information" },
    { id: "teams", label: "Teams" },
    { id: "performance", label: "Performance" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-700 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navigation />

      {/* Employee Profile Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
          <div className="flex items-start justify-between">
            {/* Left - Profile Info */}
            <div className="flex items-start space-x-6">
              {/* Profile Photo */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>

              {/* Employee Details */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{employee.first_name} {employee.last_name}</h1>
                  <p className="text-lg text-gray-600 mt-1">{employee.job_title || "Employee"}</p>
                </div>

                <div className="text-sm text-gray-600 space-y-2">
                  <p>Employed for {employee.hire_date ? calculateEmploymentDuration(employee.hire_date) : 'N/A'}</p>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-3">
                    <div>
                      <span className="text-gray-500">Departments</span>
                      <p className="font-medium text-gray-900">{employee.department_id || "Finance"}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Office Locations</span>
                      <p className="font-medium text-gray-900">New York</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Reports To</span>
                      <p className="font-medium text-blue-600 cursor-pointer hover:underline">Nicole Ardis</p>
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center space-x-2 text-sm text-blue-600">
                  <Mail className="w-4 h-4" />
                  <span>{employee.work_email || `${employee.first_name?.toLowerCase()}.${employee.last_name?.toLowerCase()}@email.com`}</span>
                </div>

                {/* View As button */}
                <button className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 mt-4">
                  <User className="w-4 h-4" />
                  <span className="font-medium">View As</span>
                </button>
              </div>
            </div>

            {/* Right - Action Buttons */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-5 h-5" />
              </button>
              <button className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition border border-gray-300">
                Terminate
              </button>
              <button className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition">
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center space-x-8 border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 text-sm font-medium transition relative ${
                  activeTab === tab.id
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-8 pt-24">
        {/* Announcements Tab */}
        {activeTab === "announcements" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Announcements</h3>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className={`p-4 rounded-lg ${getAnnouncementColor(announcement.type)} bg-gray-50 hover:bg-gray-100 transition`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-sm text-gray-900 mb-1">{announcement.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{announcement.message}</p>
                      <p className="text-xs text-gray-400">{new Date(announcement.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      announcement.type === "holiday" ? "bg-green-100 text-green-800" :
                      announcement.type === "important" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {announcement.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Time Off Tab - Combined Leave Request & Calendar */}
        {activeTab === "time-off" && (
          <TimeOffTab
            employee={employee}
            leaveRequests={leaveRequests}
            leaveBalance={leaveBalance}
            onLeaveRequestSubmit={async (formData) => {
              // Submit leave request
              try {
                const res = await fetch("/api/hr/leave-requests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    employee_id: employee.id,
                    ...formData,
                  }),
                });
                if (res.ok) {
                  const newRequest = await res.json();
                  setLeaveRequests([newRequest, ...leaveRequests]);
                  return { success: true };
                } else {
                  return { success: false, error: "Failed to submit request" };
                }
              } catch (err) {
                return { success: false, error: "Network error" };
              }
            }}
          />
        )}

        {/* Banking Information Tab */}
        {activeTab === "banking" && (
          <BankingInformationTab
            employee={employee}
          />
        )}

        {/* Teams Tab */}
        {activeTab === "teams" && (
          <TeamsTab
            employee={employee}
          />
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <PerformanceTab
            employee={employee}
          />
        )}

      </main>
    </div>
  );
}
