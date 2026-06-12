"use client";

import React from "react";
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Plus,
  Edit2,
  Trash2,
} from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  progress: number;
  start_date: string;
  due_date: string;
  priority: "low" | "medium" | "high";
  milestones?: {
    id: string;
    title: string;
    completed: boolean;
    date: string;
  }[];
}

interface GoalsTabProps {
  employee: Employee | null;
}

export default function GoalsTab({ employee }: GoalsTabProps) {
  // Mock goals data - replace with actual API call
  const goals: Goal[] = [
    {
      id: "1",
      title: "Complete Advanced TypeScript Certification",
      description: "Obtain TypeScript certification to improve code quality and team collaboration",
      category: "Professional Development",
      status: "in_progress",
      progress: 65,
      start_date: "2026-01-15",
      due_date: "2026-06-30",
      priority: "high",
      milestones: [
        { id: "m1", title: "Complete online course modules", completed: true, date: "2026-03-01" },
        { id: "m2", title: "Pass practice exams", completed: true, date: "2026-04-15" },
        { id: "m3", title: "Schedule certification exam", completed: false, date: "2026-05-30" },
        { id: "m4", title: "Pass certification exam", completed: false, date: "2026-06-30" },
      ],
    },
    {
      id: "2",
      title: "Lead Cross-Functional Project",
      description: "Successfully lead a project involving 3+ departments to improve collaboration skills",
      category: "Leadership",
      status: "in_progress",
      progress: 40,
      start_date: "2026-02-01",
      due_date: "2026-08-31",
      priority: "high",
      milestones: [
        { id: "m1", title: "Define project scope and objectives", completed: true, date: "2026-02-15" },
        { id: "m2", title: "Assemble cross-functional team", completed: true, date: "2026-03-01" },
        { id: "m3", title: "Complete project phase 1", completed: false, date: "2026-05-31" },
        { id: "m4", title: "Final delivery and presentation", completed: false, date: "2026-08-31" },
      ],
    },
    {
      id: "3",
      title: "Improve Team Communication Scores",
      description: "Achieve 90%+ satisfaction in team communication survey",
      category: "Soft Skills",
      status: "in_progress",
      progress: 75,
      start_date: "2026-01-01",
      due_date: "2026-12-31",
      priority: "medium",
    },
    {
      id: "4",
      title: "Reduce Code Review Turnaround Time",
      description: "Reduce average code review time from 48 hours to 24 hours",
      category: "Performance",
      status: "completed",
      progress: 100,
      start_date: "2025-10-01",
      due_date: "2026-03-31",
      priority: "medium",
    },
    {
      id: "5",
      title: "Mentor Junior Team Member",
      description: "Provide guidance and mentorship to a junior developer for 6 months",
      category: "Leadership",
      status: "not_started",
      progress: 0,
      start_date: "2026-05-01",
      due_date: "2026-10-31",
      priority: "low",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "not_started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "overdue":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-4 h-4" />;
      case "in_progress":
        return <TrendingUp className="w-4 h-4" />;
      case "not_started":
        return <Circle className="w-4 h-4" />;
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Group goals by status
  const inProgressGoals = goals.filter((g) => g.status === "in_progress");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const notStartedGoals = goals.filter((g) => g.status === "not_started");
  const overdueGoals = goals.filter((g) => g.status === "overdue");

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <Target className="w-6 h-6 text-blue-600 mr-2" />
              Goals & Objectives
            </h3>
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            <span>Add Goal</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">In Progress</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{inProgressGoals.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Completed</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{completedGoals.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Not Started</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{notStartedGoals.length}</p>
              </div>
              <Circle className="w-8 h-8 text-gray-600" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">Overdue</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{overdueGoals.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => {
          const daysRemaining = calculateDaysRemaining(goal.due_date);
          const isOverdue = daysRemaining < 0 && goal.status !== "completed";

          return (
            <div key={goal.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
              {/* Goal Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full border flex items-center space-x-1 ${getStatusColor(
                        goal.status
                      )}`}
                    >
                      {getStatusIcon(goal.status)}
                      <span>{goal.status.replace("_", " ").toUpperCase()}</span>
                    </span>
                    <span className={`text-xs font-semibold uppercase ${getPriorityColor(goal.priority)}`}>
                      {goal.priority} Priority
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Start: {formatDate(goal.start_date)}
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      Due: {formatDate(goal.due_date)}
                    </span>
                    {goal.status !== "completed" && (
                      <span
                        className={`font-medium ${
                          isOverdue ? "text-red-600" : daysRemaining <= 30 ? "text-orange-600" : "text-gray-600"
                        }`}
                      >
                        {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">{goal.category}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-gray-900">{goal.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      goal.status === "completed"
                        ? "bg-green-600"
                        : goal.status === "in_progress"
                        ? "bg-blue-600"
                        : "bg-gray-400"
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Milestones */}
              {goal.milestones && goal.milestones.length > 0 && (
                <div className="border-t border-gray-200 pt-4">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3">Milestones</h5>
                  <div className="space-y-2">
                    {goal.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            milestone.completed
                              ? "bg-green-600 border-green-600"
                              : "bg-white border-gray-300"
                          }`}
                        >
                          {milestone.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              milestone.completed ? "text-gray-500 line-through" : "text-gray-900"
                            }`}
                          >
                            {milestone.title}
                          </p>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(milestone.date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {goals.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
}
