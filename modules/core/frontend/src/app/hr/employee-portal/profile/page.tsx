"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import EmployeePortalHeader from "@/components/hr/EmployeePortalHeader";
import PhotoUpload from "@/components/hr/PhotoUpload";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  work_email?: string;
  personal_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  job_title?: string;
  department_id?: string;
  employment_type?: string;
  employment_status: string;
  hire_date: string;
  date_of_birth?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  profile_photo_url?: string;
}

interface Department {
  id: string;
  name: string;
}

export default function EmployeeProfilePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/hr/employee-portal/login");
      return;
    }

    loadData(employeeId);
  }, [router]);

  const loadData = async (employeeId: string) => {
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/hr/employees`),
        fetch(`/api/hr/departments`),
      ]);

      if (empRes.ok) {
        const employees = await empRes.json();
        const emp = employees.find((e: Employee) => e.id === employeeId);
        setEmployee(emp);
        setFormData(emp);
      }

      if (deptRes.ok) {
        const depts = await deptRes.json();
        setDepartments(depts);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!employee) return;

    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      const updated = await res.json();
      setEmployee(updated);
      setEditMode(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(employee || {});
    setEditMode(false);
    setError("");
  };

  const getDepartmentName = (deptId?: string) => {
    if (!deptId) return "Not assigned";
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : "Unknown";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeePortalHeader />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <span className="text-gray-400">|</span>
              <p className="text-sm text-gray-600">View and update your information</p>
            </div>

            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5" />
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center space-x-6">
            {employee.profile_photo_url ? (
              <div className="w-24 h-24 bg-white rounded-full overflow-hidden border-4 border-white border-opacity-30">
                <img
                  src={employee.profile_photo_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">
                {employee.first_name} {employee.last_name}
              </h2>
              <p className="text-lg opacity-90 mb-1">{employee.job_title || "Employee"}</p>
              <p className="text-sm opacity-75">
                {employee.employee_code} • {getDepartmentName(employee.department_id)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75 mb-1">Employment Status</p>
              <span className="inline-flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                {employee.employment_status.replace("_", " ").toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="w-5 h-5 text-blue-600 mr-2" />
                Personal Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.first_name || ""}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.last_name || ""}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.last_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.date_of_birth || ""}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">
                      {employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString() : "Not provided"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee Code
                  </label>
                  <p className="text-gray-900">{employee.employee_code}</p>
                </div>
              </div>

              {editMode && (
                <div className="mt-6 border-t pt-6">
                  <PhotoUpload
                    currentPhotoUrl={formData.profile_photo_url || ''}
                    onPhotoChange={(photoUrl) =>
                      setFormData({ ...formData, profile_photo_url: photoUrl })
                    }
                    onPhotoRemove={() => setFormData({ ...formData, profile_photo_url: '' })}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <Mail className="w-5 h-5 text-blue-600 mr-2" />
                Contact Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Email
                  </label>
                  <p className="text-gray-900">{employee.work_email || "Not provided"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Email
                  </label>
                  {editMode ? (
                    <input
                      type="email"
                      value={formData.personal_email || ""}
                      onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.personal_email || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.phone || ""}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.phone || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <MapPin className="w-5 h-5 text-blue-600 mr-2" />
                Address
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.address || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.city || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State/Province
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.state || ""}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.state || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ZIP/Postal Code
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.zip_code || ""}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.zip_code || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.country || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <Phone className="w-5 h-5 text-blue-600 mr-2" />
                Emergency Contact
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.emergency_contact_name || ""}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.emergency_contact_name || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  {editMode ? (
                    <input
                      type="tel"
                      value={formData.emergency_contact_phone || ""}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.emergency_contact_phone || "Not provided"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.emergency_contact_relationship || ""}
                      onChange={(e) => setFormData({ ...formData, emergency_contact_relationship: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{employee.emergency_contact_relationship || "Not provided"}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold flex items-center">
                <Briefcase className="w-5 h-5 text-blue-600 mr-2" />
                Employment Information
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <p className="text-gray-900">{employee.job_title || "Not assigned"}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <p className="text-gray-900">{getDepartmentName(employee.department_id)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <p className="text-gray-900 capitalize">
                    {employee.employment_type?.replace("_", " ") || "Not specified"}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hire Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(employee.hire_date).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenure
                  </label>
                  <p className="text-gray-900">
                    {Math.floor((new Date().getTime() - new Date(employee.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {employee.employment_status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
