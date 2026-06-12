"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  Award,
  Search,
  Filter,
  Plus,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  FileText,
} from "lucide-react";

export default function CertificationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const certifications = [
    {
      id: 1,
      name: "AWS Certified Solutions Architect",
      employee: "John Doe",
      department: "Engineering",
      issueDate: "2024-06-15",
      expiryDate: "2027-06-15",
      status: "active",
      daysToExpiry: 765,
      certificateNumber: "AWS-SA-12345",
      issuer: "Amazon Web Services",
    },
    {
      id: 2,
      name: "PMP - Project Management Professional",
      employee: "Sarah Johnson",
      department: "Operations",
      issueDate: "2023-03-20",
      expiryDate: "2026-03-20",
      status: "expiring_soon",
      daysToExpiry: 45,
      certificateNumber: "PMP-98765",
      issuer: "PMI",
    },
    {
      id: 3,
      name: "CISSP - Certified Information Systems Security Professional",
      employee: "Michael Chen",
      department: "IT Security",
      issueDate: "2022-01-10",
      expiryDate: "2025-01-10",
      status: "active",
      daysToExpiry: 275,
      certificateNumber: "CISSP-54321",
      issuer: "ISC²",
    },
    {
      id: 4,
      name: "Google Cloud Professional Data Engineer",
      employee: "Emily Davis",
      department: "Data Analytics",
      issueDate: "2023-11-05",
      expiryDate: "2025-11-05",
      status: "active",
      daysToExpiry: 575,
      certificateNumber: "GCP-DE-11223",
      issuer: "Google Cloud",
    },
    {
      id: 5,
      name: "Certified ScrumMaster (CSM)",
      employee: "David Wilson",
      department: "Product",
      issueDate: "2022-08-15",
      expiryDate: "2026-02-01",
      status: "expired",
      daysToExpiry: -30,
      certificateNumber: "CSM-99887",
      issuer: "Scrum Alliance",
    },
  ];

  const getStatusBadge = (status: string, daysToExpiry: number) => {
    if (status === "expired") {
      return { text: "Expired", color: "bg-red-100 text-red-800" };
    }
    if (daysToExpiry <= 60) {
      return { text: "Expiring Soon", color: "bg-yellow-100 text-yellow-800" };
    }
    return { text: "Active", color: "bg-green-100 text-green-800" };
  };

  const filteredCertifications = certifications.filter((cert) => {
    const matchesSearch =
      cert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cert.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || cert.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: certifications.length,
    active: certifications.filter(c => c.status === "active" && c.daysToExpiry > 60).length,
    expiringSoon: certifications.filter(c => c.daysToExpiry > 0 && c.daysToExpiry <= 60).length,
    expired: certifications.filter(c => c.daysToExpiry < 0).length,
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Professional Certifications</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Certifications:</span> {stats.total}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Active:</span> {stats.active}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Expiring Soon:</span> {stats.expiringSoon}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Expired:</span> {stats.expired}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
              Add Certification
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search certifications, employees, or departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expiring_soon">Expiring Soon</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Certifications Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Certification</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Days to Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCertifications.map((cert) => {
                  const badge = getStatusBadge(cert.status, cert.daysToExpiry);
                  return (
                    <tr key={cert.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{cert.name}</p>
                          <p className="text-xs text-gray-500">Issued by: {cert.issuer}</p>
                          <p className="text-xs text-gray-400 font-mono">{cert.certificateNumber}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 border border-gray-300 bg-white">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{cert.employee}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">{cert.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                        {new Date(cert.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        <span className="text-sm font-medium text-gray-900">
                          {cert.daysToExpiry < 0 ? `${Math.abs(cert.daysToExpiry)} days ago` : `${cert.daysToExpiry} days`}
                        </span>
                      </td>
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge.color}`}>
                          {badge.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 border border-gray-300 bg-white">
                        <div className="flex items-center space-x-2">
                          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          {cert.daysToExpiry <= 90 && cert.daysToExpiry > 0 && (
                            <button className="text-sm text-yellow-600 hover:text-yellow-800 font-medium flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Renew</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCertifications.length === 0 && (
              <div className="p-12 text-center">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Certifications Found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
