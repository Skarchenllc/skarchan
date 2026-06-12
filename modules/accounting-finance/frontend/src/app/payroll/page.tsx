"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/toast-context";
import {
  Users,
  DollarSign,
  Calendar,
  FileText,
  Plus,
  Play,
  Check,
  X,
  Settings
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  department: string;
  employment_type: string;
  employment_status: string;
  email: string;
  hire_date: string;
}

interface PayrollRun {
  id: string;
  payroll_number: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  status: string;
  total_gross_pay: number;
  total_net_pay: number;
  employee_count: number;
  department?: string;
}

interface Payslip {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  gross_pay: number;
  total_taxes: number;
  total_deductions: number;
  net_pay: number;
}

type Tab = "overview" | "employees" | "payroll-runs" | "payslips" | "settings";

export default function PayrollPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showPayrollRunModal, setShowPayrollRunModal] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    loadEmployees();
    loadPayrollRuns();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/payroll/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const loadPayrollRuns = async () => {
    try {
      const res = await fetch("/api/payroll/payroll-runs");
      if (res.ok) {
        const data = await res.json();
        setPayrollRuns(data);
      }
    } catch (err) {
      console.error("Failed to load payroll runs", err);
    }
  };

  const loadPayslips = async (payrollRunId?: string) => {
    try {
      const url = payrollRunId
        ? `/api/payroll/payslips?payroll_run_id=${payrollRunId}`
        : "/api/payroll/payslips";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayslips(data);
      }
    } catch (err) {
      console.error("Failed to load payslips", err);
    }
  };

  const createEmployee = async (employeeData: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });

      if (res.ok) {
        success("Employee created successfully");
        setShowEmployeeModal(false);
        loadEmployees();
      } else {
        const data = await res.json();
        error(data.detail || "Failed to create employee");
      }
    } catch (err) {
      error("Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const createPayrollRun = async (runData: any) => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/payroll-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(runData),
      });

      if (res.ok) {
        success("Payroll run created successfully");
        setShowPayrollRunModal(false);
        loadPayrollRuns();
      } else {
        const data = await res.json();
        error(data.detail || "Failed to create payroll run");
      }
    } catch (err) {
      error("Failed to create payroll run");
    } finally {
      setLoading(false);
    }
  };

  const processPayroll = async (runId: string) => {
    if (!confirm("Are you sure you want to process this payroll?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/payroll-runs/${runId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ include_all: true }),
      });

      if (res.ok) {
        const data = await res.json();
        success(`Payroll processed: ${data.payslips_created} payslips created`);
        loadPayrollRuns();
        loadPayslips(runId);
      } else {
        const data = await res.json();
        error(data.detail || "Failed to process payroll");
      }
    } catch (err) {
      error("Failed to process payroll");
    } finally {
      setLoading(false);
    }
  };

  const postJournal = async (runId: string) => {
    if (!confirm("Are you sure you want to post journal entries for this payroll?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/payroll-runs/${runId}/post-journal`, {
        method: "POST",
      });

      if (res.ok) {
        success("Journal entries posted successfully");
        loadPayrollRuns();
      } else {
        const data = await res.json();
        error(data.detail || "Failed to post journal");
      }
    } catch (err) {
      error("Failed to post journal");
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    totalEmployees: employees.length,
    activeEmployees: employees.filter(e => e.employment_status === "active").length,
    pendingPayrolls: payrollRuns.filter(r => r.status === "draft" || r.status === "pending_approval").length,
    lastPayrollAmount: payrollRuns.length > 0 ? payrollRuns[0].total_net_pay : 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-100 text-gray-800";
      case "pending_approval": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-blue-100 text-blue-800";
      case "processed": return "bg-green-100 text-green-800";
      case "posted": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
          <p className="text-gray-600">Manage employees, salary structures, and payroll processing</p>
        </div>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Employees</span>
            <span className="text-xl font-bold text-gray-900">{stats.totalEmployees}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active Employees</span>
            <span className="text-xl font-bold text-gray-900">{stats.activeEmployees}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Pending Payrolls</span>
            <span className="text-xl font-bold text-gray-900">{stats.pendingPayrolls}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Last Payroll</span>
            <span className="text-xl font-bold text-gray-900">${stats.lastPayrollAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("employees")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "employees"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Employees
            </button>
            <button
              onClick={() => setActiveTab("payroll-runs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payroll-runs"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Payroll Runs
            </button>
            <button
              onClick={() => {
                setActiveTab("payslips");
                loadPayslips();
              }}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "payslips"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Payslips
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settings
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => setShowEmployeeModal(true)}
                    className="flex items-center justify-center space-x-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                  >
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-600">Add Employee</span>
                  </button>
                  <button
                    onClick={() => setShowPayrollRunModal(true)}
                    className="flex items-center justify-center space-x-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition"
                  >
                    <Calendar className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-600">New Payroll Run</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("settings")}
                    className="flex items-center justify-center space-x-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition"
                  >
                    <Settings className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-600">Configure Taxes</span>
                  </button>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-4">Recent Payroll Runs</h2>
                {payrollRuns.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 pt-24">No payroll runs yet. Create your first payroll run to get started.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payroll #</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employees</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {payrollRuns.slice(0, 5).map((run) => (
                          <tr key={run.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{run.payroll_number}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{run.pay_period_start} to {run.pay_period_end}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{run.pay_date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{run.employee_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">${run.total_net_pay.toLocaleString()}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(run.status)}`}>
                                {run.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Employee List</h2>
                <button
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Employee</span>
                </button>
              </div>

              {employees.length === 0 ? (
                <p className="text-gray-500 text-center py-8 pt-24">No employees found. Add your first employee to get started.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hire Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {employees.map((emp) => (
                        <tr key={emp.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{emp.employee_code}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.first_name} {emp.last_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.department}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.employment_type}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              emp.employment_status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                            }`}>
                              {emp.employment_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{emp.hire_date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Payroll Runs Tab */}
          {activeTab === "payroll-runs" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Payroll Runs</h2>
                <button
                  onClick={() => setShowPayrollRunModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Payroll Run</span>
                </button>
              </div>

              {payrollRuns.length === 0 ? (
                <p className="text-gray-500 text-center py-8 pt-24">No payroll runs found. Create your first payroll run to get started.</p>
              ) : (
                <div className="space-y-4">
                  {payrollRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{run.payroll_number}</h3>
                          <p className="text-sm text-gray-600">
                            Period: {run.pay_period_start} to {run.pay_period_end}
                          </p>
                          <p className="text-sm text-gray-600">Pay Date: {run.pay_date}</p>
                          <div className="mt-2 flex items-center space-x-4">
                            <span className="text-sm">Employees: {run.employee_count}</span>
                            <span className="text-sm">Gross: ${run.total_gross_pay.toLocaleString()}</span>
                            <span className="text-sm font-medium">Net: ${run.total_net_pay.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(run.status)}`}>
                            {run.status}
                          </span>
                          <div className="flex space-x-2">
                            {run.status === "draft" && (
                              <button
                                onClick={() => processPayroll(run.id)}
                                disabled={loading}
                                className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                <Play className="w-3 h-3" />
                                <span>Process</span>
                              </button>
                            )}
                            {run.status === "processed" && (
                              <button
                                onClick={() => postJournal(run.id)}
                                disabled={loading}
                                className="flex items-center space-x-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                              >
                                <Check className="w-3 h-3" />
                                <span>Post Journal</span>
                              </button>
                            )}
                            {run.status === "processed" && (
                              <button
                                onClick={() => loadPayslips(run.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                View Payslips
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Payslips Tab */}
          {activeTab === "payslips" && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Payslips</h2>
              {payslips.length === 0 ? (
                <p className="text-gray-500 text-center py-8 pt-24">No payslips found. Process a payroll run to generate payslips.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pay Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payslips.map((slip) => (
                        <tr key={slip.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{slip.pay_date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{slip.pay_period_start} to {slip.pay_period_end}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">${slip.gross_pay.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">${slip.total_taxes.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">${slip.total_deductions.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">${slip.net_pay.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button className="text-blue-600 hover:text-blue-900">
                              <FileText className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Payroll Settings</h2>
                <p className="text-gray-600 mb-4">Configure tax rates, deductions, and payroll defaults</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Tax Configurations</h3>
                    <p className="text-sm text-gray-600 mb-3">Manage federal, state, and local tax rates</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Configure Taxes →
                    </button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Salary Structures</h3>
                    <p className="text-sm text-gray-600 mb-3">Define salary components and deductions</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Manage Structures →
                    </button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Pay Schedules</h3>
                    <p className="text-sm text-gray-600 mb-3">Set up weekly, bi-weekly, or monthly pay schedules</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Configure Schedules →
                    </button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Journal Accounts</h3>
                    <p className="text-sm text-gray-600 mb-3">Configure default accounts for payroll posting</p>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Set Accounts →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Employee Modal - Simplified */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Add New Employee</h3>
              <button onClick={() => setShowEmployeeModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createEmployee({
                employee_code: formData.get("employee_code"),
                first_name: formData.get("first_name"),
                last_name: formData.get("last_name"),
                email: formData.get("email"),
                department: formData.get("department"),
                employment_type: formData.get("employment_type"),
                hire_date: formData.get("hire_date"),
              });
            }}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Employee Code *</label>
                  <input name="employee_code" required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <input name="department" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input name="first_name" required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input name="last_name" required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input name="email" type="email" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Employment Type *</label>
                  <select name="employment_type" required className="w-full border rounded px-3 py-2">
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hire Date *</label>
                  <input name="hire_date" type="date" required className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payroll Run Modal - Simplified */}
      {showPayrollRunModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">New Payroll Run</h3>
              <button onClick={() => setShowPayrollRunModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              createPayrollRun({
                payroll_number: formData.get("payroll_number"),
                pay_period_start: formData.get("pay_period_start"),
                pay_period_end: formData.get("pay_period_end"),
                pay_date: formData.get("pay_date"),
                department: formData.get("department") || undefined,
              });
            }}>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payroll Number *</label>
                  <input name="payroll_number" required className="w-full border rounded px-3 py-2" placeholder="PR-2026-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department (optional)</label>
                  <input name="department" className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pay Period Start *</label>
                  <input name="pay_period_start" type="date" required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pay Period End *</label>
                  <input name="pay_period_end" type="date" required className="w-full border rounded px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pay Date *</label>
                  <input name="pay_date" type="date" required className="w-full border rounded px-3 py-2" />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPayrollRunModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Payroll Run
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
