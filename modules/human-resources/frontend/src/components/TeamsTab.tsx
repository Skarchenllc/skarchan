"use client";

import { useState } from "react";
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Building,
  User,
  Award,
  Clock,
  TrendingUp,
} from "lucide-react";

interface TeamsTabProps {
  employee: any;
}

interface TeamMember {
  id: string;
  name: string;
  job_title: string;
  email: string;
  phone?: string;
  department: string;
  location?: string;
  employee_code: string;
  profile_image?: string;
  is_online?: boolean;
}

export default function TeamsTab({ employee }: TeamsTabProps) {
  const [activeView, setActiveView] = useState<"team" | "department" | "org">("team");

  // Mock team data - replace with actual API call
  const teamMembers: TeamMember[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      job_title: "HR Senior Manager",
      email: "sarah.johnson@company.com",
      phone: "+1 (555) 123-4567",
      department: "Human Resources",
      location: "New York, NY",
      employee_code: "EMP003",
      is_online: true,
    },
    {
      id: "2",
      name: "Jennifer Martinez",
      job_title: "HR Senior Manager",
      email: "jennifer.martinez@company.com",
      phone: "+1 (555) 234-5678",
      department: "Human Resources",
      location: "San Francisco, CA",
      employee_code: "EMP004",
      is_online: false,
    },
    {
      id: "3",
      name: "Alex Thompson",
      job_title: "Senior Full Stack Developer",
      email: "alex.thompson@company.com",
      phone: "+1 (555) 345-6789",
      department: "Engineering",
      location: "Seattle, WA",
      employee_code: "EMP005",
      is_online: true,
    },
  ];

  const departmentMembers: TeamMember[] = [
    ...teamMembers,
    {
      id: "4",
      name: "Lucas Martinez",
      job_title: "Product Designer",
      email: "lucas.martinez@company.com",
      department: "Design",
      location: "Los Angeles, CA",
      employee_code: "EMP006",
      is_online: false,
    },
    {
      id: "5",
      name: "Sophie Chen",
      job_title: "Product Designer",
      email: "sophie.chen@company.com",
      department: "Design",
      location: "Austin, TX",
      employee_code: "EMP007",
      is_online: true,
    },
  ];

  const organizationStats = {
    totalEmployees: 8,
    departments: 4,
    locations: 5,
    teams: 3,
  };

  const getInitials = (name: string) => {
    const names = name.split(" ");
    return names.map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  const renderTeamView = () => (
    <div className="space-y-6">
      {/* Team Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Direct Team</h3>
            <p className="text-gray-600">
              People you work closely with in your immediate team
            </p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{teamMembers.length}</div>
            <div className="text-xs text-gray-500">Team Members</div>
          </div>
        </div>
      </div>

      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => (
          <div
            key={member.id}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition"
          >
            {/* Avatar and Online Status */}
            <div className="flex items-start space-x-4 mb-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                  {getInitials(member.name)}
                </div>
                {member.is_online !== undefined && (
                  <div
                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      member.is_online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 truncate">{member.name}</h4>
                <p className="text-sm text-gray-600 truncate">{member.job_title}</p>
                <p className="text-xs text-gray-500">{member.employee_code}</p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <a
                  href={`mailto:${member.email}`}
                  className="text-blue-600 hover:underline truncate"
                >
                  {member.email}
                </a>
              </div>

              {member.phone && (
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a
                    href={`tel:${member.phone}`}
                    className="text-gray-600 hover:text-gray-900 truncate"
                  >
                    {member.phone}
                  </a>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm">
                <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600 truncate">{member.department}</span>
              </div>

              {member.location && (
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-600 truncate">{member.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderDepartmentView = () => (
    <div className="space-y-6">
      {/* Department Overview */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {employee?.department || "Your Department"}
            </h3>
            <p className="text-gray-600">
              All members of your department across different teams
            </p>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {departmentMembers.length}
            </div>
            <div className="text-xs text-gray-500">Department Members</div>
          </div>
        </div>
      </div>

      {/* Department Members List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {departmentMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-gray-50 transition flex items-center space-x-4"
            >
              {/* Avatar */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                  {getInitials(member.name)}
                </div>
                {member.is_online !== undefined && (
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      member.is_online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900">{member.name}</h4>
                  <span className="text-xs text-gray-500">({member.employee_code})</span>
                </div>
                <p className="text-sm text-gray-600">{member.job_title}</p>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-xs text-gray-500 flex items-center">
                    <Building className="w-3 h-3 mr-1" />
                    {member.department}
                  </span>
                  {member.location && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {member.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Actions */}
              <div className="flex items-center space-x-2">
                <a
                  href={`mailto:${member.email}`}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Send Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                    title="Call"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrgView = () => (
    <div className="space-y-6">
      {/* Organization Overview */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Organization Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {organizationStats.totalEmployees}
            </div>
            <div className="text-xs text-gray-500">Total Employees</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Building className="w-8 h-8 text-green-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {organizationStats.departments}
            </div>
            <div className="text-xs text-gray-500">Departments</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <MapPin className="w-8 h-8 text-orange-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {organizationStats.locations}
            </div>
            <div className="text-xs text-gray-500">Office Locations</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <Award className="w-8 h-8 text-purple-600 mb-2" />
            <div className="text-2xl font-bold text-gray-900">{organizationStats.teams}</div>
            <div className="text-xs text-gray-500">Active Teams</div>
          </div>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <Building className="w-5 h-5 text-blue-600 mr-2" />
          Departments
        </h4>
        <div className="space-y-3">
          {[
            { name: "Human Resources", count: 2, color: "blue" },
            { name: "Engineering", count: 3, color: "green" },
            { name: "Design", count: 2, color: "purple" },
            { name: "Operations", count: 1, color: "orange" },
          ].map((dept) => (
            <div key={dept.name} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-10 h-10 rounded-lg bg-${dept.color}-100 flex items-center justify-center`}
                >
                  <Building className={`w-5 h-5 text-${dept.color}-600`} />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{dept.name}</div>
                  <div className="text-sm text-gray-500">{dept.count} members</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {Array.from({ length: Math.min(dept.count, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                {dept.count > 3 && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold">
                    +{dept.count - 3}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reporting Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
          Reporting Structure
        </h4>
        <div className="space-y-4">
          {employee?.reports_to && (
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <div className="text-sm font-semibold text-gray-900">Reports To</div>
                <div className="text-sm text-gray-700">{employee.reports_to}</div>
                <div className="text-xs text-gray-500">Direct Manager</div>
              </div>
            </div>
          )}

          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <Users className="w-5 h-5 text-green-600 mt-1" />
            <div>
              <div className="text-sm font-semibold text-gray-900">Team Members</div>
              <div className="text-sm text-gray-700">{teamMembers.length} colleagues</div>
              <div className="text-xs text-gray-500">In your immediate team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-2 flex space-x-2">
        <button
          onClick={() => setActiveView("team")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeView === "team"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>My Team</span>
        </button>
        <button
          onClick={() => setActiveView("department")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeView === "department"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Building className="w-4 h-4" />
          <span>My Department</span>
        </button>
        <button
          onClick={() => setActiveView("org")}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
            activeView === "org"
              ? "bg-blue-600 text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Organization</span>
        </button>
      </div>

      {/* Content */}
      {activeView === "team" && renderTeamView()}
      {activeView === "department" && renderDepartmentView()}
      {activeView === "org" && renderOrgView()}
    </div>
  );
}
