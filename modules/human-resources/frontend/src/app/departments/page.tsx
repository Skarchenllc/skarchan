"use client";

import { useState, useEffect } from "react";
import { Building2, Plus, Edit, Trash2, X, Users } from "lucide-react";
import Navigation from "@/components/Navigation";

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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const res = await fetch("/api/hr/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      }
    } catch (err) {
      console.error("Failed to load departments", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/hr/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Department added successfully!");
        setShowAddModal(false);
        setFormData({});
        loadDepartments();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to add department");
      }
    } catch (err) {
      alert("Failed to add department");
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartment) return;

    try {
      const res = await fetch(`/api/hr/departments/${selectedDepartment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Department updated successfully!");
        setShowEditModal(false);
        setFormData({});
        setSelectedDepartment(null);
        loadDepartments();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to update department");
      }
    } catch (err) {
      alert("Failed to update department");
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Department Management</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Departments:</span> {departments.length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Active:</span> {departments.filter(d => d.is_active).length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">With Cost Centers:</span> {departments.filter(d => d.cost_center).length}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              Add Department
            </button>
          </div>

          {/* Departments List */}
          <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading departments...</p>
            </div>
          ) : departments.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No departments found</p>
              <p className="text-sm text-gray-400">Add your first department to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {departments.map((dept) => (
                <div key={dept.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{dept.name}</h3>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedDepartment(dept);
                          setFormData(dept);
                          setShowEditModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{dept.department_code}</p>
                  {dept.description && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-2">{dept.description}</p>
                  )}
                  <div className="space-y-1 text-sm">
                    {dept.cost_center && (
                      <p className="text-gray-600">
                        <span className="font-medium">Cost Center:</span> {dept.cost_center}
                      </p>
                    )}
                    {dept.location && (
                      <p className="text-gray-600">
                        <span className="font-medium">Location:</span> {dept.location}
                      </p>
                    )}
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span>{" "}
                      <span className={dept.is_active ? "text-gray-800" : "text-gray-400"}>
                        {dept.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </main>

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Add New Department</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddDepartment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Department Code *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.department_code || ""}
                    onChange={(e) => setFormData({...formData, department_code: e.target.value})}
                    placeholder="e.g., ENG, HR, FIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Department Name *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Engineering"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Brief description of the department..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Center</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.cost_center || ""}
                    onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                    placeholder="e.g., CC-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g., Building A, Floor 3"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {showEditModal && selectedDepartment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">Edit Department</h3>
              <button onClick={() => setShowEditModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateDepartment} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-1">Department Name *</label>
                  <input
                    required
                    className="w-full border rounded px-3 py-2"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Cost Center</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.cost_center || ""}
                    onChange={(e) => setFormData({...formData, cost_center: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="w-full border rounded px-3 py-2"
                    rows={3}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    className="w-full border rounded px-3 py-2"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.is_active ? "true" : "false"}
                    onChange={(e) => setFormData({...formData, is_active: e.target.value === "true"})}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
