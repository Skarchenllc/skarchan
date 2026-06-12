"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  DollarSign,
  Download,
  Eye,
  Calendar,
  Filter,
} from "lucide-react";
import jsPDF from "jspdf";
import Navigation from "@/components/Navigation";

interface Payslip {
  id: string;
  payroll_run_id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  regular_hours?: number;
  overtime_hours?: number;
  total_hours?: number;
  earnings: any;
  gross_pay: number;
  taxes: any;
  total_taxes: number;
  deductions: any;
  total_deductions: number;
  net_pay: number;
  ytd_gross?: number;
  ytd_taxes?: number;
  ytd_deductions?: number;
  ytd_net?: number;
  payment_method?: string;
  overtime_pay?: number;
  bonus_amount?: number;
}

export default function PayslipsPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/employee-portal/login");
      return;
    }

    loadData(employeeId);
  }, [router]);

  const loadData = async (employeeId: string) => {
    try {
      // Load employee data
      const resEmp = await fetch(`/api/hr/employees`);
      if (resEmp.ok) {
        const employees = await resEmp.json();
        const emp = employees.find((e: any) => e.id === employeeId);
        setEmployee(emp);
      }

      // Load payslips for this employee
      const resPayslips = await fetch(`/api/hr/payslips?employee_id=${employeeId}`);
      if (resPayslips.ok) {
        const payslipsData = await resPayslips.json();
        setPayslips(payslipsData);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // Documents section removed - was dummy data

  const years = ["2026", "2025", "2024", "2023"];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getPayPeriod = (payslip: Payslip) => {
    const start = new Date(payslip.pay_period_start);
    const end = new Date(payslip.pay_period_end);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const getStatusColor = (payslip: Payslip) => {
    // Payslips that have been created are considered "paid"
    return "bg-green-100 text-green-800";
  };

  // Document type color function removed - was for dummy data

  const filteredPayslips = payslips.filter((slip) => {
    const year = new Date(slip.pay_period_end).getFullYear().toString();
    return year === selectedYear;
  });

  const totalPaidYTD = filteredPayslips.reduce((sum, slip) => sum + slip.net_pay, 0);
  const totalDeductionsYTD = filteredPayslips.reduce((sum, slip) => sum + slip.total_deductions, 0);

  const handleViewPayslip = (payslip: Payslip) => {
    setViewingPayslip(payslip);
  };

  const handleDownloadPayslip = (payslip: Payslip) => {
    // Generate PDF payslip
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper function to add text with automatic line wrapping
    const addText = (text: string, x: number, y: number, options: any = {}) => {
      pdf.text(text, x, y, options);
    };

    // Helper function to draw a line
    const drawLine = (y: number) => {
      pdf.line(margin, y, pageWidth - margin, y);
    };

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    addText('PAYSLIP', pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
    drawLine(yPos);
    yPos += 10;

    // Employee Information
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    addText(`Employee: ${employee ? `${employee.first_name} ${employee.last_name}` : 'N/A'}`, margin, yPos);
    yPos += 6;
    addText(`Employee Code: ${employee?.employee_code || 'N/A'}`, margin, yPos);
    yPos += 6;
    addText(`Pay Period: ${new Date(payslip.pay_period_start).toLocaleDateString()} - ${new Date(payslip.pay_period_end).toLocaleDateString()}`, margin, yPos);
    yPos += 6;
    addText(`Pay Date: ${new Date(payslip.pay_date).toLocaleDateString()}`, margin, yPos);
    yPos += 10;
    drawLine(yPos);
    yPos += 8;

    // Hours Worked Section
    if (payslip.regular_hours || payslip.overtime_hours) {
      pdf.setFont('helvetica', 'bold');
      addText('HOURS WORKED', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
      addText(`Regular Hours: ${(payslip.regular_hours || 0).toFixed(2)}h`, margin + 5, yPos);
      yPos += 5;
      addText(`Overtime Hours: ${(payslip.overtime_hours || 0).toFixed(2)}h`, margin + 5, yPos);
      yPos += 5;
      addText(`Total Hours: ${(payslip.total_hours || 0).toFixed(2)}h`, margin + 5, yPos);
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
    }

    // Earnings Section
    const earnings = payslip.earnings || {};
    if (Object.keys(earnings).length > 0 || payslip.overtime_pay || payslip.bonus_amount) {
      pdf.setFont('helvetica', 'bold');
      addText('EARNINGS', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');

      Object.entries(earnings).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').toUpperCase();
        const amount = formatCurrency(value as number);
        addText(label, margin + 5, yPos);
        addText(amount, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 5;
      });

      if (payslip.overtime_pay && payslip.overtime_pay > 0) {
        addText('OVERTIME PAY', margin + 5, yPos);
        addText(formatCurrency(payslip.overtime_pay), pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 5;
      }

      if (payslip.bonus_amount && payslip.bonus_amount > 0) {
        addText('BONUS', margin + 5, yPos);
        addText(formatCurrency(payslip.bonus_amount), pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 5;
      }

      yPos += 2;
      drawLine(yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      addText('GROSS PAY', margin + 5, yPos);
      addText(formatCurrency(payslip.gross_pay), pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
    }

    // Taxes Section
    const taxes = payslip.taxes || {};
    if (Object.keys(taxes).length > 0) {
      pdf.setFont('helvetica', 'bold');
      addText('TAXES', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');

      Object.entries(taxes).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').toUpperCase();
        const amount = `-${formatCurrency(value as number)}`;
        addText(label, margin + 5, yPos);
        addText(amount, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 5;
      });

      yPos += 2;
      drawLine(yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      addText('TOTAL TAXES', margin + 5, yPos);
      addText(`-${formatCurrency(payslip.total_taxes)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
    }

    // Deductions Section
    const deductions = payslip.deductions || {};
    if (Object.keys(deductions).length > 0) {
      pdf.setFont('helvetica', 'bold');
      addText('DEDUCTIONS', margin, yPos);
      yPos += 6;
      pdf.setFont('helvetica', 'normal');

      Object.entries(deductions).forEach(([key, value]) => {
        const label = key.replace(/_/g, ' ').toUpperCase();
        const amount = `-${formatCurrency(value as number)}`;
        addText(label, margin + 5, yPos);
        addText(amount, pageWidth - margin - 5, yPos, { align: 'right' });
        yPos += 5;
      });

      yPos += 2;
      drawLine(yPos);
      yPos += 5;
      pdf.setFont('helvetica', 'bold');
      addText('TOTAL DEDUCTIONS', margin + 5, yPos);
      addText(`-${formatCurrency(payslip.total_deductions)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      yPos += 8;
      drawLine(yPos);
      yPos += 8;
    }

    // Net Pay (highlighted)
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPos - 5, contentWidth, 12, 'F');
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    addText('NET PAY', margin + 5, yPos + 3);
    addText(formatCurrency(payslip.net_pay), pageWidth - margin - 5, yPos + 3, { align: 'right' });
    yPos += 15;
    drawLine(yPos);
    yPos += 8;

    // Footer
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    addText(`Payment Method: ${payslip.payment_method || 'Direct Deposit'}`, margin, yPos);
    yPos += 6;
    addText(`Generated on: ${new Date().toLocaleString()}`, margin, yPos);

    // Save the PDF
    pdf.save(`Payslip_${payslip.pay_period_start}_to_${payslip.pay_period_end}.pdf`);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Payslips & Documents</h1>
            <span className="text-gray-400">|</span>
            <p className="text-sm text-gray-600">View and download your payment history and documents</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Payslips Section */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center">
                <DollarSign className="w-5 h-5 text-blue-600 mr-2" />
                Payment History
              </h3>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayslips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      No payslips found for {selectedYear}
                    </td>
                  </tr>
                ) : (
                  filteredPayslips.map((slip) => (
                    <tr key={slip.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{getPayPeriod(slip)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(slip.pay_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                        {formatCurrency(slip.gross_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                        -{formatCurrency(slip.total_deductions + slip.total_taxes)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                        {formatCurrency(slip.net_pay)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(slip)}`}>
                          paid
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewPayslip(slip)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPayslip(slip)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition"
                            title="Download Payslip"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* View Payslip Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Payslip Details</h2>
              <button
                onClick={() => setViewingPayslip(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Employee & Period Info */}
              <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Employee</p>
                    <p className="font-semibold text-gray-900">
                      {employee ? `${employee.first_name} ${employee.last_name}` : 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">{employee?.employee_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Pay Period</p>
                    <p className="font-semibold text-gray-900">{getPayPeriod(viewingPayslip)}</p>
                    <p className="text-sm text-gray-600">Pay Date: {new Date(viewingPayslip.pay_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Hours Worked */}
              {(viewingPayslip.regular_hours || viewingPayslip.overtime_hours) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Hours Worked</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">Regular Hours</p>
                      <p className="text-lg font-bold text-gray-900">{(viewingPayslip.regular_hours || 0).toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">Overtime Hours</p>
                      <p className="text-lg font-bold text-gray-900">{(viewingPayslip.overtime_hours || 0).toFixed(2)}h</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded border border-gray-300">
                      <p className="text-xs text-gray-600">Total Hours</p>
                      <p className="text-lg font-bold text-gray-900">{(viewingPayslip.total_hours || 0).toFixed(2)}h</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Earnings */}
              {viewingPayslip.earnings && Object.keys(viewingPayslip.earnings).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Earnings</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-300 space-y-2">
                    {Object.entries(viewingPayslip.earnings).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                    {viewingPayslip.overtime_pay > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">OVERTIME PAY</span>
                        <span className="font-medium text-gray-900">{formatCurrency(viewingPayslip.overtime_pay)}</span>
                      </div>
                    )}
                    {viewingPayslip.bonus_amount > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">BONUS</span>
                        <span className="font-medium text-gray-900">{formatCurrency(viewingPayslip.bonus_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-400">
                      <span className="font-semibold text-gray-900">GROSS PAY</span>
                      <span className="font-bold text-gray-900 text-lg">{formatCurrency(viewingPayslip.gross_pay)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Taxes */}
              {viewingPayslip.taxes && Object.keys(viewingPayslip.taxes).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Taxes</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-300 space-y-2">
                    {Object.entries(viewingPayslip.taxes).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="font-medium text-gray-900">-{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-400">
                      <span className="font-semibold text-gray-900">TOTAL TAXES</span>
                      <span className="font-bold text-gray-900">-{formatCurrency(viewingPayslip.total_taxes)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Deductions */}
              {viewingPayslip.deductions && Object.keys(viewingPayslip.deductions).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Deductions</h3>
                  <div className="bg-gray-50 p-4 rounded border border-gray-300 space-y-2">
                    {Object.entries(viewingPayslip.deductions).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="font-medium text-gray-900">-{formatCurrency(value as number)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-400">
                      <span className="font-semibold text-gray-900">TOTAL DEDUCTIONS</span>
                      <span className="font-bold text-gray-900">-{formatCurrency(viewingPayslip.total_deductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Pay */}
              <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-900">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">NET PAY</span>
                  <span className="text-2xl font-bold text-gray-900">{formatCurrency(viewingPayslip.net_pay)}</span>
                </div>
                {viewingPayslip.payment_method && (
                  <p className="text-xs text-gray-600 mt-2">Payment Method: {viewingPayslip.payment_method}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => handleDownloadPayslip(viewingPayslip)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
