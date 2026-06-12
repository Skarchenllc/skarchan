"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/hr/Navigation";
import { Plus, Edit2, Trash2, X, DollarSign, TrendingUp, ArrowRight, Shield, Award } from "lucide-react";

interface PayGrade {
  id: string;
  grade_code: string;
  grade_name: string;
  grade_level: number;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  currency: string;
  description: string;
  is_active: boolean;
}

interface SalaryBand {
  id: string;
  job_title: string;
  department: string;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  currency: string;
  market_data_source: string;
  last_reviewed_date: string;
  is_active: boolean;
}

export default function SalaryStructurePage() {
  const [payGrades, setPayGrades] = useState<PayGrade[]>([]);
  const [salaryBands, setSalaryBands] = useState<SalaryBand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pay-grades" | "salary-bands">("pay-grades");

  // Modal states
  const [showPayGradeModal, setShowPayGradeModal] = useState(false);
  const [showSalaryBandModal, setShowSalaryBandModal] = useState(false);
  const [editingPayGrade, setEditingPayGrade] = useState<PayGrade | null>(null);
  const [editingSalaryBand, setEditingSalaryBand] = useState<SalaryBand | null>(null);

  // Form states for Pay Grade
  const [payGradeForm, setPayGradeForm] = useState({
    grade_code: "",
    grade_name: "",
    grade_level: 1,
    min_salary: 0,
    mid_salary: 0,
    max_salary: 0,
    currency: "USD",
    description: "",
    is_active: true
  });

  // Form states for Salary Band
  const [salaryBandForm, setSalaryBandForm] = useState({
    job_title: "",
    department: "",
    min_salary: 0,
    mid_salary: 0,
    max_salary: 0,
    currency: "USD",
    market_data_source: "",
    last_reviewed_date: new Date().toISOString().split('T')[0],
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payGradesRes, salaryBandsRes] = await Promise.all([
        fetch("/api/hr/compensation/pay-grades"),
        fetch("/api/hr/compensation/salary-bands")
      ]);

      if (payGradesRes.ok) setPayGrades(await payGradesRes.json());
      if (salaryBandsRes.ok) setSalaryBands(await salaryBandsRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Pay Grade CRUD operations
  const openPayGradeModal = (payGrade?: PayGrade) => {
    if (payGrade) {
      setEditingPayGrade(payGrade);
      setPayGradeForm({
        grade_code: payGrade.grade_code,
        grade_name: payGrade.grade_name,
        grade_level: payGrade.grade_level,
        min_salary: payGrade.min_salary,
        mid_salary: payGrade.mid_salary,
        max_salary: payGrade.max_salary,
        currency: payGrade.currency,
        description: payGrade.description || "",
        is_active: payGrade.is_active
      });
    } else {
      setEditingPayGrade(null);
      setPayGradeForm({
        grade_code: "",
        grade_name: "",
        grade_level: 1,
        min_salary: 0,
        mid_salary: 0,
        max_salary: 0,
        currency: "USD",
        description: "",
        is_active: true
      });
    }
    setShowPayGradeModal(true);
  };

  const savePayGrade = async () => {
    try {
      const url = editingPayGrade
        ? `/api/hr/compensation/pay-grades/${editingPayGrade.id}`
        : "/api/hr/compensation/pay-grades";

      const method = editingPayGrade ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payGradeForm)
      });

      if (response.ok) {
        setShowPayGradeModal(false);
        loadData();
      } else {
        console.error("Failed to save pay grade");
      }
    } catch (error) {
      console.error("Error saving pay grade:", error);
    }
  };

  const deletePayGrade = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pay grade?")) return;

    try {
      const response = await fetch(`/api/hr/compensation/pay-grades/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadData();
      } else {
        console.error("Failed to delete pay grade");
      }
    } catch (error) {
      console.error("Error deleting pay grade:", error);
    }
  };

  // Salary Band CRUD operations
  const openSalaryBandModal = (salaryBand?: SalaryBand) => {
    if (salaryBand) {
      setEditingSalaryBand(salaryBand);
      setSalaryBandForm({
        job_title: salaryBand.job_title,
        department: salaryBand.department || "",
        min_salary: salaryBand.min_salary,
        mid_salary: salaryBand.mid_salary,
        max_salary: salaryBand.max_salary,
        currency: salaryBand.currency,
        market_data_source: salaryBand.market_data_source || "",
        last_reviewed_date: salaryBand.last_reviewed_date || new Date().toISOString().split('T')[0],
        is_active: salaryBand.is_active
      });
    } else {
      setEditingSalaryBand(null);
      setSalaryBandForm({
        job_title: "",
        department: "",
        min_salary: 0,
        mid_salary: 0,
        max_salary: 0,
        currency: "USD",
        market_data_source: "",
        last_reviewed_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }
    setShowSalaryBandModal(true);
  };

  const saveSalaryBand = async () => {
    try {
      const url = editingSalaryBand
        ? `/api/hr/compensation/salary-bands/${editingSalaryBand.id}`
        : "/api/hr/compensation/salary-bands";

      const method = editingSalaryBand ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(salaryBandForm)
      });

      if (response.ok) {
        setShowSalaryBandModal(false);
        loadData();
      } else {
        console.error("Failed to save salary band");
      }
    } catch (error) {
      console.error("Error saving salary band:", error);
    }
  };

  const deleteSalaryBand = async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary band?")) return;

    try {
      const response = await fetch(`/api/hr/compensation/salary-bands/${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        loadData();
      } else {
        console.error("Failed to delete salary band");
      }
    } catch (error) {
      console.error("Error deleting salary band:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 pb-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">Salary Structure & Pay Grades</h1>
          </div>

          {/* Quick Links Section */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase">Other Compensation Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Benefits Link */}
              <Link
                href="/hr/compensation/benefits"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Benefits Plans</h3>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 transition" />
                </div>
              </Link>

              {/* Bonuses Link */}
              <Link
                href="/hr/compensation/bonuses"
                className="group border border-gray-200 bg-white rounded-lg p-4 hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Bonuses & Incentives</h3>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition" />
                </div>
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("pay-grades")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "pay-grades"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <DollarSign className="inline-block w-4 h-4 mr-2" />
                Pay Grades ({payGrades.length})
              </button>
              <button
                onClick={() => setActiveTab("salary-bands")}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${
                  activeTab === "salary-bands"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <TrendingUp className="inline-block w-4 h-4 mr-2" />
                Salary Bands ({salaryBands.length})
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading data...</p>
              </div>
            ) : (
              <>
                {/* Pay Grades Tab */}
                {activeTab === "pay-grades" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">Pay Grades</h2>
                      <button
                        onClick={() => openPayGradeModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Pay Grade
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Code</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Grade Name</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Level</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Min Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Mid Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Max Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Description</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {payGrades.map((grade) => (
                            <tr key={grade.id} className="hover:bg-blue-50 transition">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">{grade.grade_code}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">{grade.grade_name}</td>
                              <td className="px-4 py-3 text-sm text-center text-gray-700 border border-gray-300">{grade.grade_level}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">${grade.min_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">${grade.mid_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">${grade.max_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">{grade.description}</td>
                              <td className="px-4 py-3 text-center border border-gray-300">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => openPayGradeModal(grade)}
                                    className="text-blue-600 hover:text-blue-800 transition"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deletePayGrade(grade.id)}
                                    className="text-red-600 hover:text-red-800 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Salary Bands Tab */}
                {activeTab === "salary-bands" && (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-900">Salary Bands by Job Title</h2>
                      <button
                        onClick={() => openSalaryBandModal()}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Salary Band
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Job Title</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Department</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Min Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Mid Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Max Salary</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Market Data Source</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Last Reviewed</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {salaryBands.map((band) => (
                            <tr key={band.id} className="hover:bg-blue-50 transition">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">{band.job_title}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">{band.department || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">${band.min_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">${band.mid_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">${band.max_salary.toLocaleString()}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">{band.market_data_source || "-"}</td>
                              <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">
                                {band.last_reviewed_date ? new Date(band.last_reviewed_date).toLocaleDateString() : "-"}
                              </td>
                              <td className="px-4 py-3 text-center border border-gray-300">
                                <div className="flex justify-center space-x-2">
                                  <button
                                    onClick={() => openSalaryBandModal(band)}
                                    className="text-blue-600 hover:text-blue-800 transition"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteSalaryBand(band.id)}
                                    className="text-red-600 hover:text-red-800 transition"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Pay Grade Modal */}
      {showPayGradeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPayGrade ? "Edit Pay Grade" : "Add New Pay Grade"}
              </h2>
              <button
                onClick={() => setShowPayGradeModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Code *</label>
                  <input
                    type="text"
                    value={payGradeForm.grade_code}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, grade_code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., G1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Name *</label>
                  <input
                    type="text"
                    value={payGradeForm.grade_name}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, grade_name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Entry Level"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level *</label>
                  <input
                    type="number"
                    value={payGradeForm.grade_level}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, grade_level: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <input
                    type="text"
                    value={payGradeForm.currency}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="USD"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary *</label>
                  <input
                    type="number"
                    value={payGradeForm.min_salary}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, min_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mid Salary *</label>
                  <input
                    type="number"
                    value={payGradeForm.mid_salary}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, mid_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary *</label>
                  <input
                    type="number"
                    value={payGradeForm.max_salary}
                    onChange={(e) => setPayGradeForm({ ...payGradeForm, max_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={payGradeForm.description}
                  onChange={(e) => setPayGradeForm({ ...payGradeForm, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Brief description of this pay grade"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={payGradeForm.is_active}
                  onChange={(e) => setPayGradeForm({ ...payGradeForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPayGradeModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={savePayGrade}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingPayGrade ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Band Modal */}
      {showSalaryBandModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingSalaryBand ? "Edit Salary Band" : "Add New Salary Band"}
              </h2>
              <button
                onClick={() => setShowSalaryBandModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input
                    type="text"
                    value={salaryBandForm.job_title}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, job_title: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Software Engineer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={salaryBandForm.department}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, department: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary *</label>
                  <input
                    type="number"
                    value={salaryBandForm.min_salary}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, min_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mid Salary *</label>
                  <input
                    type="number"
                    value={salaryBandForm.mid_salary}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, mid_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary *</label>
                  <input
                    type="number"
                    value={salaryBandForm.max_salary}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, max_salary: parseFloat(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    min="0"
                    step="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Market Data Source</label>
                  <input
                    type="text"
                    value={salaryBandForm.market_data_source}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, market_data_source: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="e.g., Glassdoor 2026"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Reviewed Date</label>
                  <input
                    type="date"
                    value={salaryBandForm.last_reviewed_date}
                    onChange={(e) => setSalaryBandForm({ ...salaryBandForm, last_reviewed_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={salaryBandForm.is_active}
                  onChange={(e) => setSalaryBandForm({ ...salaryBandForm, is_active: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label className="ml-2 text-sm text-gray-700">Active</label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowSalaryBandModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={saveSalaryBand}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingSalaryBand ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
