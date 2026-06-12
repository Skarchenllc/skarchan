"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Plus,
  ChevronLeft,
  ChevronRight,
  Save,
  Send,
  Calendar,
  Briefcase,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Copy,
} from "lucide-react";
import Navigation from "@/components/hr/Navigation";

interface TimeEntry {
  id: string;
  date: string;
  project: string;
  task: string;
  hours: number;
  description: string;
  status: "draft" | "submitted" | "approved" | "rejected";
}

interface Project {
  id: string;
  name: string;
  code: string;
  client?: string;
}

interface Timesheet {
  id: string;
  week_start: string;
  week_end: string;
  total_hours: number;
  status: "draft" | "submitted" | "approved" | "rejected";
  entries: TimeEntry[];
}

export default function TimesheetPage() {
  const router = useRouter();
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [timesheetStatus, setTimesheetStatus] = useState<"draft" | "submitted" | "approved" | "rejected">("draft");
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [entryForm, setEntryForm] = useState({
    project: "",
    task: "",
    hours: "",
    description: "",
  });

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/hr/employee-portal/login");
      return;
    }

    loadData();
  }, [router, currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as week start
    return new Date(d.setDate(diff));
  }

  function getWeekEnd(weekStart: Date): Date {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }

  function getWeekDays(weekStart: Date): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      days.push(day);
    }
    return days;
  }

  const loadData = async () => {
    try {
      // Mock projects
      const mockProjects: Project[] = [
        { id: "1", name: "Internal Development", code: "INT-001" },
        { id: "2", name: "Client Portal Redesign", code: "CLI-002", client: "Acme Corp" },
        { id: "3", name: "Mobile App Development", code: "MOB-003", client: "TechStart Inc" },
        { id: "4", name: "Database Migration", code: "DB-004" },
        { id: "5", name: "Training & Development", code: "TRN-005" },
        { id: "6", name: "Meetings & Administration", code: "ADM-006" },
      ];
      setProjects(mockProjects);

      // Mock time entries for current week
      const weekStartStr = currentWeekStart.toISOString().split("T")[0];
      const mockEntries: TimeEntry[] = [
        {
          id: "1",
          date: weekStartStr,
          project: "Internal Development",
          task: "Code Review",
          hours: 2,
          description: "Reviewed pull requests for authentication module",
          status: "draft",
        },
        {
          id: "2",
          date: weekStartStr,
          project: "Client Portal Redesign",
          task: "Frontend Development",
          hours: 6,
          description: "Implemented new dashboard components",
          status: "draft",
        },
        {
          id: "3",
          date: new Date(currentWeekStart.getTime() + 86400000).toISOString().split("T")[0],
          project: "Mobile App Development",
          task: "API Integration",
          hours: 8,
          description: "Connected mobile app to backend APIs",
          status: "draft",
        },
        {
          id: "4",
          date: new Date(currentWeekStart.getTime() + 86400000).toISOString().split("T")[0],
          project: "Meetings & Administration",
          task: "Team Meeting",
          hours: 1,
          description: "Weekly standup and sprint planning",
          status: "draft",
        },
      ];
      setTimeEntries(mockEntries);
      setTimesheetStatus("draft");
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const previousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const nextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(newWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const currentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getEntriesForDate = (date: Date): TimeEntry[] => {
    const dateStr = date.toISOString().split("T")[0];
    return timeEntries.filter((entry) => entry.date === dateStr);
  };

  const getDayTotal = (date: Date): number => {
    return getEntriesForDate(date).reduce((sum, entry) => sum + entry.hours, 0);
  };

  const getWeekTotal = (): number => {
    return timeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const getProjectTotal = (projectName: string): number => {
    return timeEntries
      .filter((entry) => entry.project === projectName)
      .reduce((sum, entry) => sum + entry.hours, 0);
  };

  const handleAddEntry = (date: Date) => {
    setSelectedDate(date.toISOString().split("T")[0]);
    setEditingEntry(null);
    setEntryForm({ project: "", task: "", hours: "", description: "" });
    setShowEntryModal(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setSelectedDate(entry.date);
    setEditingEntry(entry);
    setEntryForm({
      project: entry.project,
      task: entry.task,
      hours: entry.hours.toString(),
      description: entry.description,
    });
    setShowEntryModal(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    if (confirm("Are you sure you want to delete this time entry?")) {
      setTimeEntries(timeEntries.filter((e) => e.id !== entryId));
    }
  };

  const handleSaveEntry = () => {
    if (!entryForm.project || !entryForm.hours) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingEntry) {
      // Update existing entry
      setTimeEntries(
        timeEntries.map((e) =>
          e.id === editingEntry.id
            ? {
                ...e,
                project: entryForm.project,
                task: entryForm.task,
                hours: parseFloat(entryForm.hours),
                description: entryForm.description,
              }
            : e
        )
      );
    } else {
      // Add new entry
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        date: selectedDate,
        project: entryForm.project,
        task: entryForm.task,
        hours: parseFloat(entryForm.hours),
        description: entryForm.description,
        status: "draft",
      };
      setTimeEntries([...timeEntries, newEntry]);
    }

    setShowEntryModal(false);
    setEntryForm({ project: "", task: "", hours: "", description: "" });
  };

  const handleCopyPreviousWeek = () => {
    if (confirm("Copy time entries from previous week?")) {
      // Implementation would copy previous week's entries
      alert("Previous week entries copied (feature to be implemented)");
    }
  };

  const handleSaveTimesheet = () => {
    alert("Timesheet saved as draft");
  };

  const handleSubmitTimesheet = () => {
    if (timeEntries.length === 0) {
      alert("Please add at least one time entry before submitting");
      return;
    }
    if (confirm("Submit timesheet for approval?")) {
      setTimesheetStatus("submitted");
      alert("Timesheet submitted for manager approval");
    }
  };

  const weekDays = getWeekDays(currentWeekStart);
  const weekEnd = getWeekEnd(currentWeekStart);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading timesheet...</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Timesheet</h1>
              <span className="text-gray-400">|</span>
              <p className="text-sm text-gray-600">
                {currentWeekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} -{" "}
                {weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  timesheetStatus === "approved"
                    ? "bg-green-100 text-green-800"
                    : timesheetStatus === "submitted"
                    ? "bg-yellow-100 text-yellow-800"
                    : timesheetStatus === "rejected"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {timesheetStatus === "draft" && "Draft"}
                {timesheetStatus === "submitted" && "Pending Approval"}
                {timesheetStatus === "approved" && "Approved"}
                {timesheetStatus === "rejected" && "Rejected"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Week Navigation & Summary */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={previousWeek}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={currentWeek}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  Current Week
                </button>
                <button
                  onClick={nextWeek}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-blue-600">{getWeekTotal()}h</p>
                </div>
                <button
                  onClick={handleCopyPreviousWeek}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={timesheetStatus !== "draft"}
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy Previous Week</span>
                </button>
              </div>
            </div>

            {/* Week Grid */}
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-8 bg-gray-50 border-b">
                <div className="p-3 font-semibold text-sm text-gray-700">Project/Task</div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className="p-3 text-center border-l">
                    <div className="text-xs text-gray-500">
                      {day.toLocaleDateString("en-US", { weekday: "short" })}
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {day.toLocaleDateString("en-US", { month: "numeric", day: "numeric" })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time entries grouped by day */}
              {weekDays.map((day, dayIdx) => {
                const dayEntries = getEntriesForDate(day);
                const dayTotal = getDayTotal(day);

                return (
                  <div key={dayIdx} className="border-b last:border-b-0">
                    {dayEntries.length === 0 ? (
                      <div className="grid grid-cols-8">
                        <div className="col-span-8 p-8 text-center">
                          <button
                            onClick={() => handleAddEntry(day)}
                            disabled={timesheetStatus !== "draft"}
                            className="inline-flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add Time Entry for {day.toLocaleDateString("en-US", { weekday: "long" })}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {dayEntries.map((entry, entryIdx) => (
                          <div
                            key={entry.id}
                            className={`grid grid-cols-8 hover:bg-gray-50 ${
                              entryIdx > 0 ? "border-t border-gray-100" : ""
                            }`}
                          >
                            <div className="col-span-7 p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <Briefcase className="w-4 h-4 text-blue-600" />
                                    <span className="font-semibold text-gray-900">{entry.project}</span>
                                    {entry.task && (
                                      <>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-sm text-gray-600">{entry.task}</span>
                                      </>
                                    )}
                                  </div>
                                  {entry.description && (
                                    <p className="text-sm text-gray-600 mt-1 ml-6">{entry.description}</p>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg font-bold text-gray-900">{entry.hours}h</span>
                                  {timesheetStatus === "draft" && (
                                    <>
                                      <button
                                        onClick={() => handleEditEntry(entry)}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                      >
                                        <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEntry(entry.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="border-l p-4 flex items-center justify-center">
                              <span className="text-sm text-gray-600">
                                {day.toLocaleDateString("en-US", { weekday: "short" })}
                              </span>
                            </div>
                          </div>
                        ))}
                        {timesheetStatus === "draft" && (
                          <div className="p-2 bg-gray-50">
                            <button
                              onClick={() => handleAddEntry(day)}
                              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Add Entry</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}

              {/* Daily Totals */}
              <div className="grid grid-cols-8 bg-blue-50 border-t-2 border-blue-200">
                <div className="p-3 font-semibold text-sm text-gray-700">Daily Total</div>
                {weekDays.map((day, idx) => (
                  <div key={idx} className="p-3 text-center border-l">
                    <span className="text-sm font-bold text-blue-600">{getDayTotal(day)}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Summary */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Project Hours Summary</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Array.from(new Set(timeEntries.map((e) => e.project))).map((projectName) => {
                const projectHours = getProjectTotal(projectName);
                const percentage = getWeekTotal() > 0 ? (projectHours / getWeekTotal()) * 100 : 0;

                return (
                  <div key={projectName} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900">{projectName}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{projectHours}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% of total hours</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {timesheetStatus === "draft" && (
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={handleSaveTimesheet}
              className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              <Save className="w-5 h-5" />
              <span>Save Draft</span>
            </button>
            <button
              onClick={handleSubmitTimesheet}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Send className="w-5 h-5" />
              <span>Submit for Approval</span>
            </button>
          </div>
        )}

        {timesheetStatus === "submitted" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                This timesheet has been submitted and is awaiting manager approval.
              </p>
            </div>
          </div>
        )}

        {timesheetStatus === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800">This timesheet has been approved by your manager.</p>
            </div>
          </div>
        )}

        {timesheetStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">
                This timesheet was rejected. Please review the comments and resubmit.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Time Entry Modal */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingEntry ? "Edit Time Entry" : "Add Time Entry"}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <select
                  value={entryForm.project}
                  onChange={(e) => setEntryForm({ ...entryForm, project: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.name}>
                      {project.code} - {project.name}
                      {project.client && ` (${project.client})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Task/Activity</label>
                <input
                  type="text"
                  value={entryForm.task}
                  onChange={(e) => setEntryForm({ ...entryForm, task: e.target.value })}
                  placeholder="e.g., Frontend Development, Code Review, Meeting"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hours <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="24"
                  value={entryForm.hours}
                  onChange={(e) => setEntryForm({ ...entryForm, hours: e.target.value })}
                  placeholder="e.g., 8 or 8.5"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Use 0.25 increments (e.g., 0.25, 0.5, 0.75)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={entryForm.description}
                  onChange={(e) => setEntryForm({ ...entryForm, description: e.target.value })}
                  placeholder="Brief description of work performed..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowEntryModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEntry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                {editingEntry ? "Update Entry" : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
