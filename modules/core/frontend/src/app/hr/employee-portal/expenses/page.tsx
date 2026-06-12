"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Receipt,
  DollarSign,
  Calendar,
  Upload,
  Trash2,
  Eye,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Car,
  Calculator,
} from "lucide-react";
import Navigation from "@/components/hr/Navigation";

interface Expense {
  id: string;
  date: string;
  category: string;
  merchant: string;
  amount: number;
  currency: string;
  description: string;
  receipt_url?: string;
  status: string;
  submitted_at: string;
  approved_at?: string;
  rejected_reason?: string;
  reimbursed_at?: string;
}

interface ExpenseCategory {
  id: string;
  name: string;
  requiresReceipt: boolean;
  maxAmount?: number;
}

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewExpense, setShowNewExpense] = useState(false);
  const [showMileageCalc, setShowMileageCalc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    category: "meals",
    merchant: "",
    amount: "",
    description: "",
    receipt: null as File | null,
  });

  const [mileageData, setMileageData] = useState({
    startLocation: "",
    endLocation: "",
    distance: "",
    rate: "0.67", // IRS 2024 rate
    purpose: "",
  });

  const categories: ExpenseCategory[] = [
    { id: "meals", name: "Meals & Entertainment", requiresReceipt: true, maxAmount: 75 },
    { id: "travel", name: "Travel & Accommodation", requiresReceipt: true },
    { id: "transportation", name: "Transportation (Taxi, Uber)", requiresReceipt: true, maxAmount: 50 },
    { id: "mileage", name: "Mileage Reimbursement", requiresReceipt: false },
    { id: "office", name: "Office Supplies", requiresReceipt: true, maxAmount: 100 },
    { id: "phone", name: "Phone & Internet", requiresReceipt: true, maxAmount: 50 },
    { id: "training", name: "Training & Education", requiresReceipt: true },
    { id: "other", name: "Other Business Expenses", requiresReceipt: true },
  ];

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/hr/employee-portal/login");
      return;
    }

    loadExpenses();
  }, [router]);

  const loadExpenses = async () => {
    try {
      // Mock data - replace with API call
      const mockExpenses: Expense[] = [
        {
          id: "1",
          date: "2026-04-05",
          category: "meals",
          merchant: "Starbucks",
          amount: 45.50,
          currency: "USD",
          description: "Client meeting lunch",
          status: "approved",
          submitted_at: "2026-04-05T14:30:00",
          approved_at: "2026-04-06T09:15:00",
          reimbursed_at: "2026-04-08T10:00:00",
        },
        {
          id: "2",
          date: "2026-04-03",
          category: "travel",
          merchant: "United Airlines",
          amount: 450.00,
          currency: "USD",
          description: "Flight to NY for conference",
          status: "pending",
          submitted_at: "2026-04-03T16:20:00",
        },
        {
          id: "3",
          date: "2026-03-28",
          category: "mileage",
          merchant: "Mileage Reimbursement",
          amount: 67.00,
          currency: "USD",
          description: "100 miles to client site",
          status: "rejected",
          submitted_at: "2026-03-28T11:00:00",
          rejected_reason: "Missing odometer readings",
        },
      ];
      setExpenses(mockExpenses);
    } catch (err) {
      console.error("Failed to load expenses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newExpense: Expense = {
        id: Date.now().toString(),
        date: formData.date,
        category: formData.category,
        merchant: formData.merchant,
        amount: parseFloat(formData.amount),
        currency: "USD",
        description: formData.description,
        status: "pending",
        submitted_at: new Date().toISOString(),
      };

      setExpenses([newExpense, ...expenses]);
      setShowNewExpense(false);
      setFormData({
        date: new Date().toISOString().split("T")[0],
        category: "meals",
        merchant: "",
        amount: "",
        description: "",
        receipt: null,
      });
    } catch (err) {
      console.error("Failed to submit expense", err);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMileageAmount = () => {
    const distance = parseFloat(mileageData.distance);
    const rate = parseFloat(mileageData.rate);
    if (!isNaN(distance) && !isNaN(rate)) {
      return (distance * rate).toFixed(2);
    }
    return "0.00";
  };

  const handleMileageSubmit = () => {
    const amount = calculateMileageAmount();
    setFormData({
      ...formData,
      category: "mileage",
      merchant: "Mileage Reimbursement",
      amount: amount,
      description: `${mileageData.distance} miles: ${mileageData.purpose}`,
    });
    setShowMileageCalc(false);
    setShowNewExpense(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "reimbursed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "reimbursed":
        return <DollarSign className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredExpenses = expenses.filter((exp) =>
    filterStatus === "all" ? true : exp.status === filterStatus
  );

  const totalPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalApproved = expenses
    .filter((e) => e.status === "approved" || e.status === "reimbursed")
    .reduce((sum, e) => sum + e.amount, 0);
  const totalRejected = expenses
    .filter((e) => e.status === "rejected")
    .reduce((sum, e) => sum + e.amount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Expense Reimbursement</h1>
              <span className="text-gray-400">|</span>
              <p className="text-sm text-gray-600">Submit and track your expense claims</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMileageCalc(true)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                <Car className="w-4 h-4" />
                <span>Mileage Calculator</span>
              </button>
              <button
                onClick={() => setShowNewExpense(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>New Expense</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterStatus === "pending"
                  ? "bg-yellow-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilterStatus("approved")}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterStatus === "approved"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilterStatus("reimbursed")}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterStatus === "reimbursed"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Reimbursed
            </button>
            <button
              onClick={() => setFilterStatus("rejected")}
              className={`px-3 py-1.5 text-sm rounded-lg transition ${
                filterStatus === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Rejected
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">
              Your Expenses ({filteredExpenses.length})
            </h3>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No expenses found</p>
              <button
                onClick={() => setShowNewExpense(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Submit Your First Expense
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {filteredExpenses.map((expense) => (
                <div key={expense.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-1">
                          <h4 className="font-semibold text-gray-900">{expense.merchant}</h4>
                          <span
                            className={`inline-flex items-center space-x-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                              expense.status
                            )}`}
                          >
                            {getStatusIcon(expense.status)}
                            <span>{expense.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{expense.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span className="capitalize">{expense.category.replace("_", " ")}</span>
                          <span>•</span>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Submitted {new Date(expense.submitted_at).toLocaleDateString()}</span>
                        </div>
                        {expense.rejected_reason && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800">
                            <strong>Rejection reason:</strong> {expense.rejected_reason}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          ${expense.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">{expense.currency}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {expense.receipt_url && (
                          <button
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Download Receipt"
                          >
                            <Download className="w-4 h-4" />
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
      </main>

      {/* New Expense Modal */}
      {showNewExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Submit New Expense</h2>
            </div>

            <form onSubmit={handleSubmitExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merchant/Vendor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.merchant}
                  onChange={(e) => setFormData({ ...formData, merchant: e.target.value })}
                  placeholder="e.g., Starbucks, United Airlines"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (USD) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Business purpose of this expense..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt {categories.find((c) => c.id === formData.category)?.requiresReceipt && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receipt: e.target.files ? e.target.files[0] : null,
                    })
                  }
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload receipt (PDF, JPG, PNG - Max 5MB)
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewExpense(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
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
                    <>
                      <Receipt className="w-4 h-4" />
                      <span>Submit Expense</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mileage Calculator Modal */}
      {showMileageCalc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Car className="w-6 h-6 text-blue-600 mr-2" />
                Mileage Calculator
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Location
                </label>
                <input
                  type="text"
                  value={mileageData.startLocation}
                  onChange={(e) =>
                    setMileageData({ ...mileageData, startLocation: e.target.value })
                  }
                  placeholder="e.g., Office address"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Location
                </label>
                <input
                  type="text"
                  value={mileageData.endLocation}
                  onChange={(e) =>
                    setMileageData({ ...mileageData, endLocation: e.target.value })
                  }
                  placeholder="e.g., Client site"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance (miles)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={mileageData.distance}
                  onChange={(e) => setMileageData({ ...mileageData, distance: e.target.value })}
                  placeholder="0.0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate per mile (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={mileageData.rate}
                    onChange={(e) => setMileageData({ ...mileageData, rate: e.target.value })}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  IRS 2024 standard rate: $0.67/mile
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Purpose
                </label>
                <input
                  type="text"
                  value={mileageData.purpose}
                  onChange={(e) => setMileageData({ ...mileageData, purpose: e.target.value })}
                  placeholder="e.g., Client meeting"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">
                    Calculated Reimbursement:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${calculateMileageAmount()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowMileageCalc(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMileageSubmit}
                  disabled={!mileageData.distance || !mileageData.purpose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Use This Amount</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
