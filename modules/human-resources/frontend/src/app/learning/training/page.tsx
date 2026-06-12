"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Users,
  Clock,
  Calendar,
  CheckCircle,
  PlayCircle,
  FileText,
  Award,
  X,
  Edit,
  Trash2,
} from "lucide-react";

interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  category: string;
  type: string;
  duration: string;
  format: string;
  instructor: string;
  enrolled: number;
  capacity: number;
  completed: number;
  status: string;
  startDate: string;
  endDate: string;
  schedule: string;
}

export default function TrainingProgramsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<TrainingProgram | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    type: "",
    duration: "",
    format: "",
    instructor: "",
    capacity: 0,
    status: "upcoming",
    startDate: "",
    endDate: "",
    schedule: "",
  });

  const [programs, setPrograms] = useState<TrainingProgram[]>([
    {
      id: 1,
      title: "Leadership Development Program",
      description: "Comprehensive leadership training for managers and team leads",
      category: "Management",
      type: "Internal",
      duration: "6 weeks",
      format: "Hybrid",
      instructor: "Sarah Johnson",
      enrolled: 32,
      capacity: 40,
      completed: 18,
      status: "ongoing",
      startDate: "2026-03-15",
      endDate: "2026-04-26",
      schedule: "Mon & Wed, 2:00 PM - 4:00 PM",
    },
    {
      id: 2,
      title: "Technical Skills Bootcamp",
      description: "Intensive training on latest technical skills and tools",
      category: "Technical",
      type: "External",
      duration: "4 weeks",
      format: "Online",
      instructor: "Michael Chen",
      enrolled: 45,
      capacity: 45,
      completed: 45,
      status: "completed",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      schedule: "Self-paced",
    },
    {
      id: 3,
      title: "Communication & Presentation Skills",
      description: "Enhance your communication and public speaking abilities",
      category: "Soft Skills",
      type: "Internal",
      duration: "3 weeks",
      format: "In-person",
      instructor: "Emily Davis",
      enrolled: 28,
      capacity: 30,
      completed: 12,
      status: "ongoing",
      startDate: "2026-03-20",
      endDate: "2026-04-10",
      schedule: "Fridays, 10:00 AM - 12:00 PM",
    },
    {
      id: 4,
      title: "Data Analytics & Reporting",
      description: "Learn to analyze data and create impactful reports",
      category: "Technical",
      type: "Internal",
      duration: "5 weeks",
      format: "Hybrid",
      instructor: "David Wilson",
      enrolled: 0,
      capacity: 25,
      completed: 0,
      status: "upcoming",
      startDate: "2026-05-01",
      endDate: "2026-06-05",
      schedule: "Tue & Thu, 3:00 PM - 5:00 PM",
    },
  ]);

  const filteredPrograms = programs.filter((program) => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || program.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddProgram = () => {
    const newProgram: TrainingProgram = {
      id: Math.max(...programs.map(p => p.id), 0) + 1,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      duration: formData.duration,
      format: formData.format,
      instructor: formData.instructor,
      enrolled: 0,
      capacity: formData.capacity,
      completed: 0,
      status: formData.status,
      startDate: formData.startDate,
      endDate: formData.endDate,
      schedule: formData.schedule,
    };
    setPrograms([...programs, newProgram]);
    resetForm();
    setShowAddModal(false);
  };

  const handleEditProgram = () => {
    if (!editingProgram) return;

    const updatedPrograms = programs.map(p =>
      p.id === editingProgram.id
        ? { ...editingProgram, ...formData }
        : p
    );
    setPrograms(updatedPrograms);
    resetForm();
    setEditingProgram(null);
  };

  const handleDeleteProgram = (id: number) => {
    if (confirm("Are you sure you want to delete this training program?")) {
      setPrograms(programs.filter(p => p.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      type: "",
      duration: "",
      format: "",
      instructor: "",
      capacity: 0,
      status: "upcoming",
      startDate: "",
      endDate: "",
      schedule: "",
    });
  };

  const openEditModal = (program: TrainingProgram) => {
    setEditingProgram(program);
    setFormData({
      title: program.title,
      description: program.description,
      category: program.category,
      type: program.type,
      duration: program.duration,
      format: program.format,
      instructor: program.instructor,
      capacity: program.capacity,
      status: program.status,
      startDate: program.startDate,
      endDate: program.endDate,
      schedule: program.schedule,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "upcoming":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
            <h1 className="text-2xl font-bold text-gray-900">Training Programs</h1>
          </div>

          {/* Stats */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Programs:</span> {programs.length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Upcoming:</span> {programs.filter(p => p.status === "upcoming").length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Ongoing:</span> {programs.filter(p => p.status === "ongoing").length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Completed:</span> {programs.filter(p => p.status === "completed").length}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Total Enrolled:</span> {programs.reduce((sum, p) => sum + p.enrolled, 0)}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Total Capacity:</span> {programs.reduce((sum, p) => sum + p.capacity, 0)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 py-4 border-b border-gray-200">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition inline-block"
            >
              <Plus className="w-4 h-4 inline-block mr-1" />
              Add Training Program
            </button>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search programs..."
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
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Programs Table */}
          <div className="p-6 overflow-x-auto">
            {filteredPrograms.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Programs Found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Duration</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Format</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Instructor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Enrolled / Capacity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredPrograms.map((program) => (
                    <tr key={program.id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                        {program.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.duration}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.format}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.instructor}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {program.enrolled} / {program.capacity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 border border-gray-300 bg-white">
                        {new Date(program.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm border border-gray-300 bg-white">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                          {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm border border-gray-300 bg-white">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(program)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProgram(program.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
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
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Training Program Modal */}
      {(showAddModal || editingProgram) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {editingProgram ? "Edit Training Program" : "Add Training Program"}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProgram(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Program Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Technical, Management, Soft Skills"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration *
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 4 weeks, 2 days"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format *
                  </label>
                  <select
                    value={formData.format}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Format</option>
                    <option value="Online">Online</option>
                    <option value="In-person">In-person</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Self-paced">Self-paced</option>
                  </select>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instructor *
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Schedule */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule *
                  </label>
                  <input
                    type="text"
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    placeholder="e.g., Mon & Wed, 2:00 PM - 4:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProgram(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editingProgram ? handleEditProgram : handleAddProgram}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editingProgram ? "Update Program" : "Add Program"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
