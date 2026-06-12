"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  Clock,
  Award,
  FileText,
  Play,
  Settings,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  Printer,
  Mail,
  CheckSquare,
  Square,
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  job_title: string;
  base_salary: number;
  hourly_rate: number;
  overtime_eligible: boolean;
}

interface AttendanceRecord {
  employee_id: string;
  regular_hours: number;
  overtime_hours: number;
  total_hours: number;
}

interface Bonus {
  employee_id: string;
  amount: number;
  status: string;
}

interface PayrollComponent {
  id: string;
  code: string;
  name: string;
  type: "earning" | "pre_tax_deduction" | "tax" | "post_tax_deduction";
  calculationMethod: "percentage" | "fixed_amount" | "formula" | "hours_based";
  calculationValue?: number;
  calculationFormula?: string;
  baseComponent?: string;
  displayOrder: number;
  isVisible: boolean;
  colorCode: string;
}

interface PayrollData {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  [key: string]: any; // Dynamic component values
}

export default function PayrollPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [configName, setConfigName] = useState("Default Configuration");

  const [payPeriodStart, setPayPeriodStart] = useState("");
  const [payPeriodEnd, setPayPeriodEnd] = useState("");

  // Selection state
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Race condition prevention for auto-save
  const isSaving = useRef(false);
  const lastSavedPeriod = useRef<string>("");

  useEffect(() => {
    // Set default pay period (current bi-weekly period)
    const today = new Date();
    const startOfPeriod = new Date(today);
    startOfPeriod.setDate(today.getDate() - 13); // Last 2 weeks

    setPayPeriodStart(startOfPeriod.toISOString().split('T')[0]);
    setPayPeriodEnd(today.toISOString().split('T')[0]);

    // Load configuration
    loadConfiguration();
  }, []);

  useEffect(() => {
    if (payPeriodStart && payPeriodEnd && components.length > 0) {
      loadPayrollData();
    }
  }, [payPeriodStart, payPeriodEnd, components]);

  // AUTO-SAVE DISABLED: Use "Save Payroll Run" button manually to prevent duplicates
  // The auto-save was creating duplicate payslips when dates were slightly changed
  // useEffect(() => {
  //   const periodKey = `${payPeriodStart}-${payPeriodEnd}`;
  //   if (
  //     payrollData.length > 0 &&
  //     payPeriodStart &&
  //     payPeriodEnd &&
  //     !isSaving.current &&
  //     lastSavedPeriod.current !== periodKey
  //   ) {
  //     autoSavePayslips();
  //   }
  // }, [payrollData, payPeriodStart, payPeriodEnd]);

  const loadConfiguration = () => {
    try {
      const savedConfig = localStorage.getItem('payrollConfiguration');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        setComponents(config.components.filter((c: PayrollComponent) => c.isVisible));
        setConfigName(config.name);
      } else {
        // Default USA configuration if none saved
        const defaultComponents: PayrollComponent[] = [
          { id: "1", code: "BASE_PAY", name: "Base Pay", type: "earning", calculationMethod: "hours_based", calculationFormula: "hourly_rate * regular_hours", displayOrder: 1, isVisible: true, colorCode: "#10b981" },
          { id: "2", code: "OT_PAY", name: "Overtime", type: "earning", calculationMethod: "hours_based", calculationFormula: "hourly_rate * 1.5 * overtime_hours", displayOrder: 2, isVisible: true, colorCode: "#f59e0b" },
          { id: "3", code: "BONUS", name: "Bonus", type: "earning", calculationMethod: "fixed_amount", displayOrder: 3, isVisible: true, colorCode: "#10b981" },
          { id: "4", code: "401K", name: "401(k)", type: "pre_tax_deduction", calculationMethod: "percentage", calculationValue: 6, baseComponent: "GROSS_PAY", displayOrder: 4, isVisible: true, colorCode: "#8b5cf6" },
          { id: "5", code: "HEALTH", name: "Health Ins", type: "pre_tax_deduction", calculationMethod: "fixed_amount", calculationValue: 150, displayOrder: 5, isVisible: true, colorCode: "#8b5cf6" },
          { id: "6", code: "FIT", name: "Fed Tax", type: "tax", calculationMethod: "percentage", calculationValue: 12, baseComponent: "TAXABLE_WAGES", displayOrder: 6, isVisible: true, colorCode: "#ef4444" },
          { id: "7", code: "SIT", name: "State Tax", type: "tax", calculationMethod: "percentage", calculationValue: 5, baseComponent: "TAXABLE_WAGES", displayOrder: 7, isVisible: true, colorCode: "#ef4444" },
          { id: "8", code: "FICA_SS", name: "Soc Sec", type: "tax", calculationMethod: "percentage", calculationValue: 6.2, baseComponent: "TAXABLE_WAGES", displayOrder: 8, isVisible: true, colorCode: "#ef4444" },
          { id: "9", code: "MEDICARE", name: "Medicare", type: "tax", calculationMethod: "percentage", calculationValue: 1.45, baseComponent: "TAXABLE_WAGES", displayOrder: 9, isVisible: true, colorCode: "#ef4444" },
        ];
        setComponents(defaultComponents);
        setConfigName("United States Payroll Configuration");
      }
    } catch (err) {
      console.error('Failed to load configuration', err);
    }
  };

  const loadPayrollData = async () => {
    setLoading(true);
    try {
      // Load employees, attendance, and bonuses in parallel
      const [employeesRes, attendanceRes, bonusesRes] = await Promise.all([
        fetch("/api/hr/employees"),
        fetch(`/api/hr/attendance?start_date=${payPeriodStart}&end_date=${payPeriodEnd}`),
        fetch("/api/hr/compensation/bonuses")
      ]);

      const employeesData = employeesRes.ok ? await employeesRes.json() : [];
      const attendanceData = attendanceRes.ok ? await attendanceRes.json() : [];
      const bonusesData = bonusesRes.ok ? await bonusesRes.json() : [];

      setEmployees(employeesData);
      setBonuses(bonusesData.filter((b: Bonus) => b.status === "approved" || b.status === "paid"));

      // Process attendance data: aggregate by employee
      const attendanceByEmployee = processAttendance(attendanceData);
      setAttendance(attendanceByEmployee);

      // Calculate payroll with dynamic components
      const payroll = calculateDynamicPayroll(employeesData, attendanceByEmployee, bonusesData);
      setPayrollData(payroll);

    } catch (error) {
      console.error("Failed to load payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  const processAttendance = (records: any[]): AttendanceRecord[] => {
    const byEmployee = new Map<string, { regular: number; overtime: number }>();

    records.forEach(record => {
      const existing = byEmployee.get(record.employee_id) || { regular: 0, overtime: 0 };
      existing.regular += record.regular_hours || 0;
      existing.overtime += record.overtime_hours || 0;
      byEmployee.set(record.employee_id, existing);
    });

    return Array.from(byEmployee.entries()).map(([employee_id, hours]) => ({
      employee_id,
      regular_hours: hours.regular,
      overtime_hours: hours.overtime,
      total_hours: hours.regular + hours.overtime
    }));
  };

  const calculateDynamicPayroll = (
    employees: Employee[],
    attendance: AttendanceRecord[],
    bonuses: Bonus[]
  ): PayrollData[] => {
    return employees.map(emp => {
      const empAttendance = attendance.find(a => a.employee_id === emp.id);
      const empBonuses = bonuses
        .filter(b => b.employee_id === emp.id && (b.status === "approved" || b.status === "paid"))
        .reduce((sum, b) => sum + b.amount, 0);

      const regularHours = empAttendance?.regular_hours || 0;
      const overtimeHours = empAttendance?.overtime_hours || 0;

      const data: PayrollData = {
        employee_id: emp.id,
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_code: emp.employee_code,
      };

      // Store intermediate values for calculations
      let grossPay = 0;
      let totalPreTax = 0;
      let taxableWages = 0;

      // Process components in order by type
      const sortedComponents = [...components].sort((a, b) => a.displayOrder - b.displayOrder);

      // First pass: Calculate earnings
      sortedComponents.filter(c => c.type === "earning").forEach(component => {
        const value = calculateComponentValue(component, {
          hourly_rate: emp.hourly_rate || 0,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          overtime_eligible: emp.overtime_eligible,
          bonuses: empBonuses,
        });
        data[component.code] = value;
        grossPay += value;
      });

      data.GROSS_PAY = grossPay;

      // Second pass: Calculate pre-tax deductions
      sortedComponents.filter(c => c.type === "pre_tax_deduction").forEach(component => {
        const value = calculateComponentValue(component, {
          gross_pay: grossPay,
          taxable_wages: taxableWages,
        });
        data[component.code] = value;
        totalPreTax += value;
      });

      // Calculate taxable wages
      taxableWages = grossPay - totalPreTax;
      data.TAXABLE_WAGES = taxableWages;

      // Third pass: Calculate taxes
      let totalTaxes = 0;
      sortedComponents.filter(c => c.type === "tax").forEach(component => {
        const value = calculateComponentValue(component, {
          gross_pay: grossPay,
          taxable_wages: taxableWages,
        });
        data[component.code] = value;
        totalTaxes += value;
      });

      // Fourth pass: Calculate post-tax deductions
      let totalPostTax = 0;
      sortedComponents.filter(c => c.type === "post_tax_deduction").forEach(component => {
        const value = calculateComponentValue(component, {
          gross_pay: grossPay,
          taxable_wages: taxableWages,
        });
        data[component.code] = value;
        totalPostTax += value;
      });

      // Calculate net pay
      data.NET_PAY = grossPay - totalPreTax - totalTaxes - totalPostTax;

      return data;
    });
  };

  const calculateComponentValue = (component: PayrollComponent, context: any): number => {
    const { calculationMethod, calculationValue, calculationFormula } = component;

    switch (calculationMethod) {
      case "percentage":
        const base = context[component.baseComponent?.toLowerCase() || "gross_pay"] || 0;
        return base * ((calculationValue || 0) / 100);

      case "fixed_amount":
        return calculationValue || 0;

      case "hours_based":
        // Evaluate formula with context
        if (calculationFormula) {
          try {
            // Simple formula evaluation
            let result = calculationFormula;
            Object.keys(context).forEach(key => {
              const regex = new RegExp(key, 'g');
              result = result.replace(regex, context[key].toString());
            });
            // Safe eval using Function constructor
            return new Function(`return ${result}`)();
          } catch (err) {
            console.error('Formula evaluation error:', err);
            return 0;
          }
        }
        return 0;

      case "formula":
        if (calculationFormula) {
          try {
            let result = calculationFormula;
            Object.keys(context).forEach(key => {
              const regex = new RegExp(key, 'g');
              result = result.replace(regex, context[key].toString());
            });
            return new Function(`return ${result}`)();
          } catch (err) {
            console.error('Formula evaluation error:', err);
            return 0;
          }
        }
        return 0;

      default:
        return 0;
    }
  };

  const getComponentColor = (component: PayrollComponent): string => {
    // Returns background color class for the component type
    switch (component.type) {
      case "earning": return "bg-green-100 text-gray-900"; // Light green background, black text
      case "pre_tax_deduction": return "bg-red-100 text-gray-900"; // Light red background, black text
      case "tax": return "bg-red-100 text-gray-900"; // Light red background, black text
      case "post_tax_deduction": return "bg-red-100 text-gray-900"; // Light red background, black text
      default: return "bg-gray-100 text-gray-900";
    }
  };

  const getCoreColumnColor = (): string => {
    return "bg-sky-100 text-gray-900"; // Light blue background, black text for core columns
  };

  // Selection handlers
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedEmployees(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(payrollData.map(p => p.employee_id));
      setSelectedEmployees(allIds);
      setSelectAll(true);
    }
  };

  const handleSelectEmployee = (employeeId: string) => {
    const newSelected = new Set(selectedEmployees);
    if (newSelected.has(employeeId)) {
      newSelected.delete(employeeId);
    } else {
      newSelected.add(employeeId);
    }
    setSelectedEmployees(newSelected);
    setSelectAll(newSelected.size === payrollData.length);
  };

  // Action handlers
  const handleExport = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee to export.");
      return;
    }
    alert(`Exporting payroll data for ${selectedEmployees.size} employee(s)...`);
    // TODO: Implement CSV/Excel export
  };

  const handleDelete = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee to delete.");
      return;
    }
    if (confirm(`Are you sure you want to delete payroll records for ${selectedEmployees.size} employee(s)?`)) {
      alert(`Deleting payroll data for ${selectedEmployees.size} employee(s)...`);
      // TODO: Implement delete
    }
  };

  const handleEdit = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee to edit.");
      return;
    }
    alert(`Editing payroll data for ${selectedEmployees.size} employee(s)...`);
    // TODO: Implement edit
  };

  const handlePrint = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee to print.");
      return;
    }
    window.print();
  };

  const handleEmail = () => {
    if (selectedEmployees.size === 0) {
      alert("Please select at least one employee to email.");
      return;
    }
    alert(`Sending payslips to ${selectedEmployees.size} employee(s)...`);
    // TODO: Implement email
  };

  // Calculate stats and visible components (needed by handleSavePayrollRun)
  const visibleComponents = components.filter(c => c.isVisible).sort((a, b) => a.displayOrder - b.displayOrder);

  const stats = {
    totalEmployees: payrollData.length,
    totalGrossPay: payrollData.reduce((sum, p) => sum + (p.GROSS_PAY || 0), 0),
    totalNetPay: payrollData.reduce((sum, p) => sum + (p.NET_PAY || 0), 0),
    totalTaxes: components
      .filter(c => c.type === "tax")
      .reduce((sum, c) => sum + payrollData.reduce((s, p) => s + (p[c.code] || 0), 0), 0),
  };

  const autoSavePayslips = async () => {
    // Only auto-save if we have payroll data
    if (payrollData.length === 0 || !payPeriodStart || !payPeriodEnd) {
      return;
    }

    // Set the saving flag to prevent concurrent saves
    if (isSaving.current) {
      console.log("Auto-save already in progress, skipping...");
      return;
    }

    const periodKey = `${payPeriodStart}-${payPeriodEnd}`;

    // Check if this period was already saved
    if (lastSavedPeriod.current === periodKey) {
      console.log(`Payslips already auto-saved for period ${periodKey}. Skipping.`);
      return;
    }

    try {
      isSaving.current = true;
      console.log(`🔄 Starting auto-save for period ${periodKey}...`);

      // Check if payslips already exist for this pay period in database
      const checkResponse = await fetch(
        `/api/hr/payslips?pay_period_start=${payPeriodStart}&pay_period_end=${payPeriodEnd}`
      );

      if (checkResponse.ok) {
        const existingPayslips = await checkResponse.json();

        // If payslips already exist for this exact period, don't create duplicates
        if (existingPayslips && existingPayslips.length > 0) {
          console.log(`✓ Payslips already exist in database for period ${payPeriodStart} to ${payPeriodEnd}. Skipping auto-save.`);
          lastSavedPeriod.current = periodKey; // Mark as saved to prevent future attempts
          return;
        }
      }

      // Prepare payroll run data (same structure as manual save)
      const payrollRunData = {
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: new Date().toISOString().split('T')[0],
        total_employees: payrollData.length,
        total_gross_pay: stats.totalGrossPay,
        total_net_pay: stats.totalNetPay,
        total_taxes: stats.totalTaxes,
        status: 'PROCESSED',
        payslips: payrollData.map(payroll => {
          const earnings = visibleComponents
            .filter(c => c.type === 'earning')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const preTaxDeductions = visibleComponents
            .filter(c => c.type === 'pre_tax_deduction')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const taxes = visibleComponents
            .filter(c => c.type === 'tax')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const postTaxDeductions = visibleComponents
            .filter(c => c.type === 'post_tax_deduction')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          return {
            employee_id: payroll.employee_id,
            gross_pay: payroll.GROSS_PAY || 0,
            net_pay: payroll.NET_PAY || 0,
            total_deductions: preTaxDeductions + postTaxDeductions,
            total_taxes: taxes,
            overtime_hours: attendance.find(a => a.employee_id === payroll.employee_id)?.overtime_hours || 0,
            overtime_pay: payroll.OT_PAY || 0,
            bonus_amount: payroll.BONUS || 0,
            components: visibleComponents.reduce((obj, comp) => {
              obj[comp.code] = payroll[comp.code] || 0;
              return obj;
            }, {} as Record<string, number>)
          };
        })
      };

      // Save to backend silently
      const response = await fetch('/api/hr/payroll-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payrollRunData)
      });

      if (response.ok) {
        const result = await response.json();
        lastSavedPeriod.current = periodKey; // Mark this period as saved
        console.log(`✅ Auto-saved payroll run: ${result.payroll_run_id} with ${payrollData.length} payslips for period ${periodKey}`);
      } else {
        console.error('Failed to auto-save payroll run:', await response.text());
      }

    } catch (error: any) {
      console.error('Auto-save payroll error:', error);
      // Fail silently - don't interrupt user experience
    } finally {
      isSaving.current = false; // Always clear the saving flag
    }
  };

  const handleSavePayrollRun = async () => {
    if (payrollData.length === 0) {
      alert("No payroll data to save. Please calculate payroll first.");
      return;
    }

    if (!confirm(`Save payroll run for ${payrollData.length} employee(s) for the period ${new Date(payPeriodStart).toLocaleDateString()} - ${new Date(payPeriodEnd).toLocaleDateString()}?`)) {
      return;
    }

    try {
      setLoading(true);

      // Prepare payroll run data
      const payrollRunData = {
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        pay_date: new Date().toISOString().split('T')[0], // Today as pay date
        total_employees: payrollData.length,
        total_gross_pay: stats.totalGrossPay,
        total_net_pay: stats.totalNetPay,
        total_taxes: stats.totalTaxes,
        status: 'PROCESSED',
        payslips: payrollData.map(payroll => {
          // Calculate component totals
          const earnings = visibleComponents
            .filter(c => c.type === 'earning')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const preTaxDeductions = visibleComponents
            .filter(c => c.type === 'pre_tax_deduction')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const taxes = visibleComponents
            .filter(c => c.type === 'tax')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          const postTaxDeductions = visibleComponents
            .filter(c => c.type === 'post_tax_deduction')
            .reduce((sum, c) => sum + (payroll[c.code] || 0), 0);

          return {
            employee_id: payroll.employee_id,
            gross_pay: payroll.GROSS_PAY || 0,
            net_pay: payroll.NET_PAY || 0,
            total_deductions: preTaxDeductions + postTaxDeductions,
            total_taxes: taxes,
            overtime_hours: attendance.find(a => a.employee_id === payroll.employee_id)?.overtime_hours || 0,
            overtime_pay: payroll.OT_PAY || 0,
            bonus_amount: payroll.BONUS || 0,
            components: visibleComponents.reduce((obj, comp) => {
              obj[comp.code] = payroll[comp.code] || 0;
              return obj;
            }, {} as Record<string, number>)
          };
        })
      };

      // Save to backend
      const response = await fetch('/api/hr/payroll-runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payrollRunData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save payroll run');
      }

      const result = await response.json();

      alert(`✅ Payroll run saved successfully!\n\n${payrollData.length} payslips created.\nPayroll Run ID: ${result.payroll_run_id || 'N/A'}\n\nEmployees can now view their payslips in their profile.`);

    } catch (error: any) {
      console.error('Failed to save payroll run:', error);
      alert(`❌ Failed to save payroll run: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payroll Processing</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {configName} • {visibleComponents.length} components
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={loadConfiguration}
                  className="flex items-center px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition border border-gray-300"
                  title="Reload configuration"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <Link
                  href="/payroll/configuration"
                  className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Components
                </Link>
              </div>
            </div>
          </div>

          {/* Pay Period Selector */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <label className="text-sm font-medium text-gray-700">Pay Period:</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={payPeriodStart}
                  onChange={(e) => setPayPeriodStart(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={payPeriodEnd}
                  onChange={(e) => setPayPeriodEnd(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={loadPayrollData}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Play className="w-4 h-4 mr-2" />
                Calculate Payroll
              </button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs text-gray-500">Employees</div>
                  <div className="text-lg font-bold text-gray-900">{stats.totalEmployees}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500">Gross Pay</div>
                  <div className="text-lg font-bold text-green-600">
                    ${stats.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs text-gray-500">Net Pay</div>
                  <div className="text-lg font-bold text-blue-600">
                    ${stats.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-xs text-gray-500">Total Taxes</div>
                  <div className="text-lg font-bold text-red-600">
                    ${stats.totalTaxes.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons Bar */}
          {payrollData.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSavePayrollRun}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium shadow-sm"
                    title="Save payroll run to database"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Save Payroll Run
                  </button>
                  <span className="text-sm text-gray-700">
                    {selectedEmployees.size > 0 ? (
                      <span className="font-medium text-blue-600">
                        {selectedEmployees.size} selected
                      </span>
                    ) : (
                      "No employees selected"
                    )}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExport}
                    disabled={selectedEmployees.size === 0}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Export to CSV/Excel"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Export
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={selectedEmployees.size === 0}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Print payslips"
                  >
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </button>
                  <button
                    onClick={handleEmail}
                    disabled={selectedEmployees.size === 0}
                    className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Email payslips"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Email
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={selectedEmployees.size === 0}
                    className="flex items-center px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Edit payroll data"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={selectedEmployees.size === 0}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    title="Delete payroll records"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Calculating payroll...</p>
              </div>
            ) : payrollData.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No payroll data</p>
                <p className="text-sm text-gray-400">Select a pay period to calculate payroll</p>
              </div>
            ) : (
              <div className="p-6">
                <table className="w-full border-collapse text-xs">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 w-12">
                        <button
                          onClick={handleSelectAll}
                          className="flex items-center justify-center w-full"
                          title={selectAll ? "Deselect all" : "Select all"}
                        >
                          {selectAll ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 w-12">
                        S.#
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 sticky left-0 z-10" style={{ minWidth: '180px', maxWidth: '180px' }}>
                        Employee
                      </th>
                      {visibleComponents.map(component => (
                        <th
                          key={component.code}
                          className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100 whitespace-nowrap"
                        >
                          {component.name}
                        </th>
                      ))}
                      <th className="px-2 py-2 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {payrollData.map((payroll, index) => {
                      const isSelected = selectedEmployees.has(payroll.employee_id);
                      return (
                        <tr key={payroll.employee_id} className={`hover:bg-opacity-70 transition ${isSelected ? 'bg-blue-50' : ''}`}>
                          <td className="px-2 py-2 text-center border border-gray-300 bg-white">
                            <button
                              onClick={() => handleSelectEmployee(payroll.employee_id)}
                              className="flex items-center justify-center w-full"
                              title={isSelected ? "Deselect" : "Select"}
                            >
                              {isSelected ? (
                                <CheckSquare className="w-4 h-4 text-blue-600" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              )}
                            </button>
                          </td>
                          <td className="px-2 py-2 text-center border border-gray-300 bg-white">
                            <span className="text-xs font-medium text-gray-700">{index + 1}</span>
                          </td>
                          <td className={`px-2 py-2 border border-gray-300 sticky left-0 z-10 ${getCoreColumnColor()}`} style={{ minWidth: '180px', maxWidth: '180px' }}>
                            <Link
                              href={`/employees/${payroll.employee_id}`}
                              className="block hover:bg-blue-50 rounded px-1 py-0.5 -mx-1 -my-0.5 transition"
                              title="View employee profile"
                            >
                              <div className="text-xs font-medium text-blue-600 hover:text-blue-800 truncate">
                                {payroll.employee_name}
                              </div>
                              <div className="text-xs text-gray-500">{payroll.employee_code}</div>
                            </Link>
                          </td>
                          {visibleComponents.map(component => {
                            const value = payroll[component.code] || 0;
                            const colorClass = getComponentColor(component);
                            const isDeduction = component.type === "pre_tax_deduction" || component.type === "tax" || component.type === "post_tax_deduction";

                            return (
                              <td
                                key={component.code}
                                className={`px-2 py-2 text-right border border-gray-300 ${colorClass}`}
                              >
                                {value > 0 ? (
                                  <span className="text-gray-900">
                                    {isDeduction && '-'}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">$0.00</span>
                                )}
                              </td>
                            );
                          })}
                          <td className={`px-2 py-2 text-right font-bold border border-gray-300 ${getCoreColumnColor()}`}>
                            ${(payroll.NET_PAY || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-100">
                    <tr className="font-bold text-xs">
                      <td className="px-2 py-2 text-center border border-gray-300 bg-gray-100" colSpan={2}>
                        {/* Checkbox and S.# columns merged for footer */}
                      </td>
                      <td className={`px-2 py-2 text-left border border-gray-300 sticky left-0 z-10 ${getCoreColumnColor()}`}>TOTALS</td>
                      {visibleComponents.map(component => {
                        const total = payrollData.reduce((sum, p) => sum + (p[component.code] || 0), 0);
                        const colorClass = getComponentColor(component);
                        const isDeduction = component.type === "pre_tax_deduction" || component.type === "tax" || component.type === "post_tax_deduction";

                        return (
                          <td key={component.code} className={`px-2 py-2 text-right border border-gray-300 ${colorClass}`}>
                            <span className="text-gray-900">
                              {isDeduction && '-'}${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                        );
                      })}
                      <td className={`px-2 py-2 text-right border border-gray-300 ${getCoreColumnColor()}`}>
                        <span className="text-gray-900">
                          ${stats.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
