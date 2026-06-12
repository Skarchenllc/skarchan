"use client";

import { useState } from "react";
import {
  DollarSign,
  Download,
  Eye,
  Filter,
  Calendar,
  TrendingUp,
  FileText,
  X,
  Clock,
} from "lucide-react";
import jsPDF from "jspdf";

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

interface CompensationTabProps {
  employee: any;
  payslips: Payslip[];
}

export default function CompensationTab({ employee, payslips }: CompensationTabProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get pay period string
  const getPayPeriod = (payslip: Payslip) => {
    const start = new Date(payslip.pay_period_start);
    const end = new Date(payslip.pay_period_end);
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  };

  // Generate PDF for payslip
  const handleDownloadPayslip = (payslip: Payslip) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Helper function to add text with word wrap
    const addText = (
      text: string,
      x: number,
      y: number,
      fontSize: number = 10,
      isBold: boolean = false
    ) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("helvetica", isBold ? "bold" : "normal");
      pdf.text(text, x, y);
    };

    // Header
    pdf.setFillColor(59, 130, 246); // Blue
    pdf.rect(0, 0, pageWidth, 40, "F");
    pdf.setTextColor(255, 255, 255);
    addText("PAYSLIP", margin, 25, 24, true);

    pdf.setTextColor(0, 0, 0);
    yPos = 55;

    // Employee Information
    addText("Employee Information", margin, yPos, 14, true);
    yPos += 10;
    addText(`Name: ${employee.first_name} ${employee.last_name}`, margin, yPos);
    yPos += 7;
    addText(`Employee Code: ${employee.employee_code}`, margin, yPos);
    yPos += 7;
    addText(`Job Title: ${employee.job_title || "N/A"}`, margin, yPos);
    yPos += 7;
    addText(`Email: ${employee.work_email || "N/A"}`, margin, yPos);
    yPos += 15;

    // Pay Period Information
    addText("Pay Period Information", margin, yPos, 14, true);
    yPos += 10;
    addText(`Pay Period: ${getPayPeriod(payslip)}`, margin, yPos);
    yPos += 7;
    addText(
      `Pay Date: ${new Date(payslip.pay_date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
      margin,
      yPos
    );
    yPos += 15;

    // Hours Worked
    if (payslip.regular_hours || payslip.overtime_hours) {
      addText("Hours Worked", margin, yPos, 14, true);
      yPos += 10;
      if (payslip.regular_hours) {
        addText(`Regular Hours: ${payslip.regular_hours}h`, margin, yPos);
        yPos += 7;
      }
      if (payslip.overtime_hours) {
        addText(`Overtime Hours: ${payslip.overtime_hours}h`, margin, yPos);
        yPos += 7;
      }
      if (payslip.total_hours) {
        addText(`Total Hours: ${payslip.total_hours}h`, margin, yPos);
        yPos += 7;
      }
      yPos += 8;
    }

    // Earnings Section
    addText("Earnings", margin, yPos, 14, true);
    yPos += 10;

    if (payslip.earnings) {
      const earnings =
        typeof payslip.earnings === "string"
          ? JSON.parse(payslip.earnings)
          : payslip.earnings;

      if (Array.isArray(earnings) && earnings.length > 0) {
        earnings.forEach((earning: any) => {
          if (earning.amount && earning.amount > 0) {
            addText(
              `${earning.description || "Earning"}:`,
              margin,
              yPos
            );
            addText(formatCurrency(earning.amount), pageWidth - margin - 40, yPos);
            yPos += 7;
          }
        });
      } else if (typeof earnings === "object") {
        if (earnings.gross_pay) {
          addText("Gross Pay:", margin, yPos);
          addText(formatCurrency(earnings.gross_pay), pageWidth - margin - 40, yPos);
          yPos += 7;
        }
        if (payslip.overtime_pay && payslip.overtime_pay > 0) {
          addText("Overtime Pay:", margin, yPos);
          addText(formatCurrency(payslip.overtime_pay), pageWidth - margin - 40, yPos);
          yPos += 7;
        }
        if (payslip.bonus_amount && payslip.bonus_amount > 0) {
          addText("Bonus:", margin, yPos);
          addText(formatCurrency(payslip.bonus_amount), pageWidth - margin - 40, yPos);
          yPos += 7;
        }
      }
    }

    addText("Gross Pay:", margin, yPos, 11, true);
    addText(formatCurrency(payslip.gross_pay), pageWidth - margin - 40, yPos, 11, true);
    yPos += 15;

    // Taxes Section
    addText("Taxes", margin, yPos, 14, true);
    yPos += 10;

    if (payslip.taxes) {
      const taxes =
        typeof payslip.taxes === "string" ? JSON.parse(payslip.taxes) : payslip.taxes;

      if (Array.isArray(taxes)) {
        taxes.forEach((tax: any) => {
          if (tax.amount && tax.amount > 0) {
            addText(`${tax.description || "Tax"}:`, margin, yPos);
            addText(`-${formatCurrency(tax.amount)}`, pageWidth - margin - 40, yPos);
            yPos += 7;
          }
        });
      } else if (typeof taxes === "object") {
        Object.entries(taxes).forEach(([key, value]) => {
          if (typeof value === "number" && value > 0) {
            const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            addText(`${label}:`, margin, yPos);
            addText(`-${formatCurrency(value)}`, pageWidth - margin - 40, yPos);
            yPos += 7;
          }
        });
      }
    }

    addText("Total Taxes:", margin, yPos, 11, true);
    addText(`-${formatCurrency(payslip.total_taxes)}`, pageWidth - margin - 40, yPos, 11, true);
    yPos += 15;

    // Deductions Section
    if (payslip.deductions) {
      addText("Deductions", margin, yPos, 14, true);
      yPos += 10;

      const deductions =
        typeof payslip.deductions === "string"
          ? JSON.parse(payslip.deductions)
          : payslip.deductions;

      if (Array.isArray(deductions)) {
        deductions.forEach((deduction: any) => {
          if (deduction.amount && deduction.amount > 0) {
            addText(
              `${deduction.description || "Deduction"}:`,
              margin,
              yPos
            );
            addText(`-${formatCurrency(deduction.amount)}`, pageWidth - margin - 40, yPos);
            yPos += 7;
          }
        });
      } else if (typeof deductions === "object") {
        Object.entries(deductions).forEach(([key, value]) => {
          if (typeof value === "number" && value > 0) {
            const label = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
            addText(`${label}:`, margin, yPos);
            addText(`-${formatCurrency(value)}`, pageWidth - margin - 40, yPos);
            yPos += 7;
          }
        });
      }

      addText("Total Deductions:", margin, yPos, 11, true);
      addText(
        `-${formatCurrency(payslip.total_deductions)}`,
        pageWidth - margin - 40,
        yPos,
        11,
        true
      );
      yPos += 15;
    }

    // Net Pay Section
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin - 5, yPos - 5, pageWidth - 2 * margin + 10, 15, "F");
    addText("NET PAY:", margin, yPos + 5, 14, true);
    addText(formatCurrency(payslip.net_pay), pageWidth - margin - 40, yPos + 5, 14, true);
    yPos += 25;

    // Payment Method
    if (payslip.payment_method) {
      addText(`Payment Method: ${payslip.payment_method}`, margin, yPos);
      yPos += 10;
    }

    // Footer
    yPos = pageHeight - 30;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      "This is a computer-generated payslip and does not require a signature.",
      pageWidth / 2,
      yPos,
      { align: "center" }
    );
    pdf.text(
      `Generated on ${new Date().toLocaleString("en-US")}`,
      pageWidth / 2,
      yPos + 5,
      { align: "center" }
    );

    // Save PDF
    const fileName = `Payslip_${getPayPeriod(payslip).replace(/\s/g, "_")}.pdf`;
    pdf.save(fileName);
  };

  // Filter payslips by selected year
  const filteredPayslips = payslips.filter((payslip) => {
    const payDate = new Date(payslip.pay_date);
    return payDate.getFullYear() === selectedYear;
  });

  // Get available years from payslips
  const availableYears = Array.from(
    new Set(payslips.map((p) => new Date(p.pay_date).getFullYear()))
  ).sort((a, b) => b - a);

  // Calculate YTD totals
  const ytdTotals = filteredPayslips.reduce(
    (acc, payslip) => ({
      gross: acc.gross + payslip.gross_pay,
      taxes: acc.taxes + payslip.total_taxes,
      deductions: acc.deductions + payslip.total_deductions,
      net: acc.net + payslip.net_pay,
    }),
    { gross: 0, taxes: 0, deductions: 0, net: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">YTD</span>
          </div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">Gross Pay</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdTotals.gross)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-xs text-gray-500">YTD</span>
          </div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">Total Taxes</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdTotals.taxes)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-orange-600" />
            </div>
            <span className="text-xs text-gray-500">YTD</span>
          </div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">Deductions</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdTotals.deductions)}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">YTD</span>
          </div>
          <h4 className="text-sm font-medium text-gray-600 mb-1">Net Pay</h4>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(ytdTotals.net)}</p>
        </div>
      </div>

      {/* Year Filter and Payslips Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Header with Year Filter */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 text-blue-600 mr-2" />
              Payslips History
            </h3>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Payslips Table */}
        <div className="overflow-x-auto">
          {filteredPayslips.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No payslips found for {selectedYear}</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pay Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gross Pay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deductions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayslips.map((payslip) => (
                  <tr key={payslip.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getPayPeriod(payslip)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(payslip.pay_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {formatCurrency(payslip.gross_pay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(payslip.total_taxes)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">
                      -{formatCurrency(payslip.total_deductions)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                      {formatCurrency(payslip.net_pay)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => setViewingPayslip(payslip)}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-lg text-blue-700 hover:bg-blue-50 transition mr-2"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => handleDownloadPayslip(payslip)}
                        className="inline-flex items-center px-3 py-1 border border-green-300 rounded-lg text-green-700 hover:bg-green-50 transition"
                        title="Download PDF"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Payslip Modal */}
      {viewingPayslip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Payslip Details</h3>
              <button
                onClick={() => setViewingPayslip(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Employee & Pay Period Info */}
              <div className="grid grid-cols-2 gap-4 bg-blue-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Employee</p>
                  <p className="font-semibold text-gray-900">
                    {employee.first_name} {employee.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{employee.employee_code}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Pay Period</p>
                  <p className="font-semibold text-gray-900">{getPayPeriod(viewingPayslip)}</p>
                  <p className="text-sm text-gray-600">
                    Pay Date:{" "}
                    {new Date(viewingPayslip.pay_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Hours Worked */}
              {(viewingPayslip.regular_hours || viewingPayslip.overtime_hours) && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                    Hours Worked
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    {viewingPayslip.regular_hours && (
                      <div>
                        <p className="text-xs text-gray-600">Regular Hours</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {viewingPayslip.regular_hours}h
                        </p>
                      </div>
                    )}
                    {viewingPayslip.overtime_hours && (
                      <div>
                        <p className="text-xs text-gray-600">Overtime Hours</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {viewingPayslip.overtime_hours}h
                        </p>
                      </div>
                    )}
                    {viewingPayslip.total_hours && (
                      <div>
                        <p className="text-xs text-gray-600">Total Hours</p>
                        <p className="text-lg font-semibold text-blue-600">
                          {viewingPayslip.total_hours}h
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Earnings */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                  Earnings
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Gross Pay</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(viewingPayslip.gross_pay)}
                    </span>
                  </div>
                  {viewingPayslip.overtime_pay && viewingPayslip.overtime_pay > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Overtime Pay</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(viewingPayslip.overtime_pay)}
                      </span>
                    </div>
                  )}
                  {viewingPayslip.bonus_amount && viewingPayslip.bonus_amount > 0 && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Bonus</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(viewingPayslip.bonus_amount)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Taxes */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-red-600" />
                  Taxes
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Total Taxes</span>
                    <span className="font-semibold text-red-600">
                      -{formatCurrency(viewingPayslip.total_taxes)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              {viewingPayslip.total_deductions > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-orange-600" />
                    Deductions
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">Total Deductions</span>
                      <span className="font-semibold text-orange-600">
                        -{formatCurrency(viewingPayslip.total_deductions)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Pay */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">NET PAY</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatCurrency(viewingPayslip.net_pay)}
                  </span>
                </div>
                {viewingPayslip.payment_method && (
                  <p className="text-xs text-gray-600 mt-2">
                    Payment Method: {viewingPayslip.payment_method}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleDownloadPayslip(viewingPayslip)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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
