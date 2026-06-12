"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Users,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Award,
  MessageSquare,
  User,
  Grid,
  List,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  work_email: string;
  phone?: string;
  job_title: string;
  department: string;
  location?: string;
  hire_date: string;
  manager_name?: string;
  avatar_url?: string;
  status: string;
  skills?: string[];
}

interface Department {
  id: string;
  name: string;
  employee_count: number;
}

export default function TeamDirectoryPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showOrgChart, setShowOrgChart] = useState(false);

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/employee-portal/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      // Fetch employees from API
      const empRes = await fetch("/api/hr/employees");
      if (empRes.ok) {
        const employeesData = await empRes.json();

        // Enrich with mock data for demo
        const enrichedEmployees: Employee[] = employeesData.map((emp: any, idx: number) => ({
          ...emp,
          phone: `+1 (555) ${String(Math.floor(Math.random() * 900) + 100)}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          department: emp.department || ["Engineering", "Human Resources", "Sales", "Marketing", "Finance"][idx % 5],
          location: ["New York", "San Francisco", "Austin", "Remote", "Chicago"][idx % 5],
          manager_name: idx > 0 ? "Sarah Johnson" : undefined,
          skills: [
            ["JavaScript", "React", "Node.js"],
            ["HR Management", "Recruiting", "Training"],
            ["Sales Strategy", "CRM", "Negotiation"],
            ["Digital Marketing", "SEO", "Content"],
            ["Financial Analysis", "Excel", "Accounting"],
          ][idx % 5],
        }));

        setEmployees(enrichedEmployees);

        // Create department list
        const deptMap = new Map<string, number>();
        enrichedEmployees.forEach((emp) => {
          deptMap.set(emp.department, (deptMap.get(emp.department) || 0) + 1);
        });

        const depts: Department[] = Array.from(deptMap.entries()).map(([name, count], idx) => ({
          id: String(idx + 1),
          name,
          employee_count: count,
        }));

        setDepartments(depts);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.work_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" || emp.department === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-teal-500",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSendMessage = (employee: Employee) => {
    // Navigate to messages page with pre-selected employee
    router.push(`/employee-portal/messages?to=${employee.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading team directory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EmployeePortalHeader />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Team Directory</h1>
              <span className="text-gray-400">|</span>
              <p className="text-sm text-gray-600">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? "employee" : "employees"}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowOrgChart(!showOrgChart)}
                className={`px-4 py-2 rounded-lg transition ${
                  showOrgChart
                    ? "bg-blue-600 text-white"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Organization Chart
              </button>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "grid"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition ${
                    viewMode === "list"
                      ? "bg-white text-blue-600 shadow"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {showOrgChart ? (
          /* Organization Chart View */
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-6">Organization Structure</h2>
            <div className="space-y-4">
              {departments.map((dept) => (
                <div key={dept.id} className="border rounded-lg">
                  <div className="p-4 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition">
                    <div className="flex items-center space-x-3">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                      <Building className="w-5 h-5 text-blue-600" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                        <p className="text-sm text-gray-500">
                          {dept.employee_count} {dept.employee_count === 1 ? "employee" : "employees"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {employees
                        .filter((emp) => emp.department === dept.name)
                        .map((emp) => (
                          <div
                            key={emp.id}
                            className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition"
                          >
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${getAvatarColor(
                                emp.first_name
                              )}`}
                            >
                              {getInitials(emp.first_name, emp.last_name)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {emp.first_name} {emp.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{emp.job_title}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Directory View */
          <>
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by name, email, title, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name} ({dept.employee_count})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Employee Grid/List */}
            {filteredEmployees.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No employees found</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${getAvatarColor(
                              emp.first_name
                            )}`}
                          >
                            {getInitials(emp.first_name, emp.last_name)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <p className="text-sm text-gray-500">{emp.employee_code}</p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            emp.status === "active"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{emp.job_title}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Building className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{emp.department}</span>
                        </div>
                        {emp.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{emp.location}</span>
                          </div>
                        )}
                      </div>

                      {emp.skills && emp.skills.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {emp.skills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                              >
                                {skill}
                              </span>
                            ))}
                            {emp.skills.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{emp.skills.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-4 border-t">
                        <a
                          href={`mailto:${emp.work_email}`}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(emp);
                          }}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Message</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow">
                {filteredEmployees.map((emp, idx) => (
                  <div
                    key={emp.id}
                    className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                      idx > 0 ? "border-t" : ""
                    }`}
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${getAvatarColor(
                            emp.first_name
                          )}`}
                        >
                          {getInitials(emp.first_name, emp.last_name)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-bold text-gray-900">
                              {emp.first_name} {emp.last_name}
                            </h3>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                emp.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {emp.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-600">{emp.job_title}</span>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">{emp.department}</span>
                            {emp.location && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{emp.location}</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <a
                              href={`mailto:${emp.work_email}`}
                              className="text-sm text-blue-600 hover:text-blue-800"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {emp.work_email}
                            </a>
                            {emp.phone && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-600">{emp.phone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={`mailto:${emp.work_email}`}
                          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="w-4 h-4 text-gray-600" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendMessage(emp);
                          }}
                          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Employee Detail Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl ${getAvatarColor(
                      selectedEmployee.first_name
                    )}`}
                  >
                    {getInitials(selectedEmployee.first_name, selectedEmployee.last_name)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedEmployee.first_name} {selectedEmployee.last_name}
                    </h2>
                    <p className="text-gray-600">{selectedEmployee.job_title}</p>
                    <p className="text-sm text-gray-500">{selectedEmployee.employee_code}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <a
                      href={`mailto:${selectedEmployee.work_email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedEmployee.work_email}
                    </a>
                  </div>
                  {selectedEmployee.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{selectedEmployee.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Work Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Work Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">{selectedEmployee.department}</span>
                  </div>
                  {selectedEmployee.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{selectedEmployee.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">
                      Joined {new Date(selectedEmployee.hire_date).toLocaleDateString()}
                    </span>
                  </div>
                  {selectedEmployee.manager_name && (
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">Reports to {selectedEmployee.manager_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Skills */}
              {selectedEmployee.skills && selectedEmployee.skills.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Skills & Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedEmployee.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                <a
                  href={`mailto:${selectedEmployee.work_email}`}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <Mail className="w-5 h-5" />
                  <span>Send Email</span>
                </a>
                <button
                  onClick={() => {
                    handleSendMessage(selectedEmployee);
                    setSelectedEmployee(null);
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
