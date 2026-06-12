"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, X } from "lucide-react";
import Navigation from "@/components/Navigation";
import PhotoUpload from "@/components/PhotoUpload";

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
  is_active: boolean;
  date_of_birth?: string;
  address_line1?: string;
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
  name: string;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [employeeId]);

  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        fetch(`/api/hr/employees/${employeeId}`),
        fetch(`/api/hr/departments`),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData);
        setFormData(empData);
      }

      if (deptRes.ok) {
        setDepartments(await deptRes.json());
      }
    } catch (err) {
      console.error("Failed to load data", err);
      setError("Failed to load employee data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/hr/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update employee");
      }

      alert("Employee updated successfully!");
      router.push(`/employees/${employeeId}`);
    } catch (err) {
      console.error("Update error:", err);
      setError("Failed to update employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else if (type === "number") {
      setFormData({ ...formData, [name]: value ? parseFloat(value) : undefined });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading employee data...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gray-200">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Employee not found</p>
            <button
              onClick={() => router.push("/employees")}
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
      <Navigation />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => router.push(`/employees/${employeeId}`)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Employee Profile
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Employee: {employee.first_name} {employee.last_name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{employee.employee_code}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* Profile Photo */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
              <PhotoUpload
                currentPhotoUrl={formData.profile_photo_url || ''}
                onPhotoChange={(photoUrl) =>
                  setFormData({ ...formData, profile_photo_url: photoUrl })
                }
                onPhotoRemove={() => setFormData({ ...formData, profile_photo_url: '' })}
              />
            </div>

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    value={formData.first_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    value={formData.last_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    name="middle_name"
                    value={formData.middle_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth ? formData.date_of_birth.split('T')[0] : ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Email
                  </label>
                  <input
                    type="email"
                    name="work_email"
                    value={formData.work_email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Email
                  </label>
                  <input
                    type="email"
                    name="personal_email"
                    value={formData.personal_email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Phone
                  </label>
                  <input
                    type="tel"
                    name="work_phone"
                    value={formData.work_phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Personal Phone
                  </label>
                  <input
                    type="tel"
                    name="personal_phone"
                    value={formData.personal_phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="job_title"
                    value={formData.job_title || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    name="department_id"
                    value={formData.department_id || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type
                  </label>
                  <select
                    name="employment_type"
                    value={formData.employment_type || 'full_time'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Status
                  </label>
                  <select
                    name="employment_status"
                    value={formData.employment_status || 'active'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="on_probation">On Probation</option>
                    <option value="suspended">Suspended</option>
                    <option value="terminated">Terminated</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Office Location
                  </label>
                  <input
                    type="text"
                    name="office_location"
                    value={formData.office_location || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Arrangement
                  </label>
                  <select
                    name="work_arrangement"
                    value={formData.work_arrangement || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="onsite">Onsite</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Compensation */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Compensation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    name="base_salary"
                    step="0.01"
                    value={formData.base_salary || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pay Frequency
                  </label>
                  <select
                    name="pay_frequency"
                    value={formData.pay_frequency || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select</option>
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="semi_monthly">Semi-Monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <input
                      type="checkbox"
                      name="overtime_eligible"
                      checked={formData.overtime_eligible || false}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    Overtime Eligible
                  </label>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_name"
                    value={formData.emergency_contact_name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="emergency_contact_phone"
                    value={formData.emergency_contact_phone || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    name="emergency_contact_relationship"
                    value={formData.emergency_contact_relationship || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => router.push(`/employees/${employeeId}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
