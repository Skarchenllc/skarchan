"use client";

import { useState } from "react";
import {
  CheckCircle,
  Circle,
  Clock,
  User,
  FileText,
  CreditCard,
  GraduationCap,
  Award,
  Building2,
  Shield,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react";

interface OnboardingTask {
  id: string;
  task_name: string;
  description: string;
  category: "documentation" | "it_setup" | "training" | "compliance" | "orientation" | "other";
  status: "pending" | "in_progress" | "completed" | "skipped";
  assigned_to?: string;
  due_date?: string;
  completed_date?: string;
  priority: "high" | "medium" | "low";
  dependencies?: string[];
  notes?: string;
}

interface OnboardingPhase {
  phase_number: number;
  phase_name: string;
  status: "pending" | "in_progress" | "completed";
  start_date?: string;
  end_date?: string;
  tasks: OnboardingTask[];
}

interface OnboardingWorkflowProps {
  employeeId: string;
  employeeName: string;
  department?: string;
  jobTitle?: string;
  startDate: string;
  onComplete?: () => void;
}

export function OnboardingWorkflow({
  employeeId,
  employeeName,
  department,
  jobTitle,
  startDate,
  onComplete
}: OnboardingWorkflowProps) {
  const [activePhase, setActivePhase] = useState(0);

  // Default onboarding phases
  const [phases, setPhases] = useState<OnboardingPhase[]>([
    {
      phase_number: 1,
      phase_name: "Pre-Boarding (Before Day 1)",
      status: "in_progress",
      tasks: [
        {
          id: "pb-1",
          task_name: "Send Welcome Email",
          description: "Send welcome email with start date, time, location, and what to bring",
          category: "documentation",
          status: "pending",
          priority: "high",
          assigned_to: "HR Team",
        },
        {
          id: "pb-2",
          task_name: "Complete Employment Contract",
          description: "Employee signs and returns employment contract",
          category: "documentation",
          status: "pending",
          priority: "high",
        },
        {
          id: "pb-3",
          task_name: "Submit Required Documents",
          description: "ID, SSN, banking details, emergency contacts",
          category: "documentation",
          status: "pending",
          priority: "high",
        },
        {
          id: "pb-4",
          task_name: "IT Account Setup",
          description: "Create email, system access, and software licenses",
          category: "it_setup",
          status: "pending",
          priority: "high",
          assigned_to: "IT Department",
        },
        {
          id: "pb-5",
          task_name: "Workspace Preparation",
          description: "Set up desk, computer, phone, and supplies",
          category: "other",
          status: "pending",
          priority: "medium",
          assigned_to: "Facilities",
        },
      ],
    },
    {
      phase_number: 2,
      phase_name: "Day 1 - First Day",
      status: "pending",
      tasks: [
        {
          id: "d1-1",
          task_name: "Welcome & Office Tour",
          description: "Welcome employee and provide office tour",
          category: "orientation",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "d1-2",
          task_name: "Team Introductions",
          description: "Introduce to team members and key stakeholders",
          category: "orientation",
          status: "pending",
          priority: "high",
        },
        {
          id: "d1-3",
          task_name: "IT Equipment Handover",
          description: "Issue laptop, phone, access cards, and other equipment",
          category: "it_setup",
          status: "pending",
          priority: "high",
          assigned_to: "IT Department",
        },
        {
          id: "d1-4",
          task_name: "HR Orientation Session",
          description: "Company policies, benefits, payroll, time tracking",
          category: "orientation",
          status: "pending",
          priority: "high",
          assigned_to: "HR Team",
        },
        {
          id: "d1-5",
          task_name: "Benefits Enrollment",
          description: "Complete health insurance, retirement plan enrollment",
          category: "documentation",
          status: "pending",
          priority: "medium",
          assigned_to: "HR Team",
        },
      ],
    },
    {
      phase_number: 3,
      phase_name: "Week 1 - First Week",
      status: "pending",
      tasks: [
        {
          id: "w1-1",
          task_name: "Role-Specific Training",
          description: "Job-specific training and system walkthroughs",
          category: "training",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "w1-2",
          task_name: "Compliance Training",
          description: "Safety, security, data protection, code of conduct",
          category: "compliance",
          status: "pending",
          priority: "high",
          assigned_to: "Compliance Team",
        },
        {
          id: "w1-3",
          task_name: "System Access Verification",
          description: "Verify all system access and permissions are working",
          category: "it_setup",
          status: "pending",
          priority: "high",
          assigned_to: "IT Department",
        },
        {
          id: "w1-4",
          task_name: "First Week Check-in",
          description: "Manager 1:1 to discuss progress and questions",
          category: "orientation",
          status: "pending",
          priority: "medium",
          assigned_to: "Manager",
        },
      ],
    },
    {
      phase_number: 4,
      phase_name: "Month 1 - First 30 Days",
      status: "pending",
      tasks: [
        {
          id: "m1-1",
          task_name: "Department Overview Training",
          description: "Learn about department goals, processes, and tools",
          category: "training",
          status: "pending",
          priority: "medium",
          assigned_to: "Manager",
        },
        {
          id: "m1-2",
          task_name: "Set Initial Goals",
          description: "Establish 30-60-90 day goals and expectations",
          category: "other",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "m1-3",
          task_name: "30-Day Review",
          description: "Formal check-in and feedback session",
          category: "orientation",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "m1-4",
          task_name: "HR Check-in",
          description: "HR follow-up on benefits, payroll, and satisfaction",
          category: "orientation",
          status: "pending",
          priority: "medium",
          assigned_to: "HR Team",
        },
      ],
    },
    {
      phase_number: 5,
      phase_name: "Month 2-3 - Integration",
      status: "pending",
      tasks: [
        {
          id: "m3-1",
          task_name: "Advanced Training",
          description: "Advanced systems and process training",
          category: "training",
          status: "pending",
          priority: "medium",
        },
        {
          id: "m3-2",
          task_name: "Project Assignment",
          description: "Assign first major project or responsibility",
          category: "other",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "m3-3",
          task_name: "60-Day Review",
          description: "Progress review and goal adjustment",
          category: "orientation",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
        {
          id: "m3-4",
          task_name: "90-Day Review",
          description: "Comprehensive performance review and probation assessment",
          category: "orientation",
          status: "pending",
          priority: "high",
          assigned_to: "Manager",
        },
      ],
    },
  ]);

  const updateTaskStatus = (phaseIndex: number, taskId: string, newStatus: OnboardingTask["status"]) => {
    setPhases(prev => {
      const updated = [...prev];
      const task = updated[phaseIndex].tasks.find(t => t.id === taskId);
      if (task) {
        task.status = newStatus;
        if (newStatus === "completed") {
          task.completed_date = new Date().toISOString();
        }
      }

      // Update phase status based on task statuses
      const allCompleted = updated[phaseIndex].tasks.every(t => t.status === "completed" || t.status === "skipped");
      const anyInProgress = updated[phaseIndex].tasks.some(t => t.status === "in_progress");

      if (allCompleted) {
        updated[phaseIndex].status = "completed";
        updated[phaseIndex].end_date = new Date().toISOString();
      } else if (anyInProgress) {
        updated[phaseIndex].status = "in_progress";
      }

      return updated;
    });
  };

  const getCategoryIcon = (category: OnboardingTask["category"]) => {
    switch (category) {
      case "documentation": return <FileText className="w-4 h-4" />;
      case "it_setup": return <Shield className="w-4 h-4" />;
      case "training": return <GraduationCap className="w-4 h-4" />;
      case "compliance": return <AlertCircle className="w-4 h-4" />;
      case "orientation": return <Building2 className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: OnboardingTask["category"]) => {
    switch (category) {
      case "documentation": return "text-blue-600";
      case "it_setup": return "text-purple-600";
      case "training": return "text-green-600";
      case "compliance": return "text-red-600";
      case "orientation": return "text-indigo-600";
      default: return "text-gray-600";
    }
  };

  const getPriorityColor = (priority: OnboardingTask["priority"]) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
    }
  };

  const getStatusColor = (status: OnboardingTask["status"]) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "in_progress": return "text-blue-600";
      case "skipped": return "text-gray-400";
      default: return "text-gray-400";
    }
  };

  const calculateProgress = () => {
    const allTasks = phases.flatMap(p => p.tasks);
    const completedTasks = allTasks.filter(t => t.status === "completed" || t.status === "skipped");
    return Math.round((completedTasks.length / allTasks.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Onboarding Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Onboarding</h2>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-semibold">Employee:</span> {employeeName}</p>
              {jobTitle && <p><span className="font-semibold">Position:</span> {jobTitle}</p>}
              {department && <p><span className="font-semibold">Department:</span> {department}</p>}
              <p><span className="font-semibold">Start Date:</span> {new Date(startDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold text-blue-600 mb-1">{progress}%</div>
            <p className="text-sm text-gray-600">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Phase Timeline */}
      <div className="flex space-x-2 overflow-x-auto pb-4">
        {phases.map((phase, index) => (
          <button
            key={phase.phase_number}
            onClick={() => setActivePhase(index)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg border-2 transition ${
              activePhase === index
                ? "border-blue-500 bg-blue-50"
                : phase.status === "completed"
                ? "border-green-500 bg-green-50"
                : phase.status === "in_progress"
                ? "border-yellow-500 bg-yellow-50"
                : "border-gray-300 bg-white"
            }`}
          >
            <div className="flex items-center space-x-2">
              {phase.status === "completed" ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : phase.status === "in_progress" ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-700">Phase {phase.phase_number}</p>
                <p className="text-sm font-medium">{phase.phase_name}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Active Phase Tasks */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Phase {phases[activePhase].phase_number}: {phases[activePhase].phase_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {phases[activePhase].tasks.filter(t => t.status === "completed").length} of {phases[activePhase].tasks.length} tasks completed
          </p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {phases[activePhase].tasks.map((task) => (
              <div
                key={task.id}
                className={`border-2 rounded-lg p-4 transition ${
                  task.status === "completed" ? "border-green-200 bg-green-50" :
                  task.status === "in_progress" ? "border-blue-200 bg-blue-50" :
                  task.status === "skipped" ? "border-gray-200 bg-gray-50" :
                  "border-gray-200 bg-white hover:border-blue-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <button
                      onClick={() => {
                        const newStatus =
                          task.status === "pending" ? "in_progress" :
                          task.status === "in_progress" ? "completed" :
                          task.status === "completed" ? "pending" :
                          "in_progress";
                        updateTaskStatus(activePhase, task.id, newStatus);
                      }}
                      className="mt-1"
                    >
                      {task.status === "completed" ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : task.status === "in_progress" ? (
                        <Clock className="w-6 h-6 text-blue-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className={`font-semibold ${task.status === "completed" ? "line-through text-gray-600" : "text-gray-900"}`}>
                          {task.task_name}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)} capitalize`}>
                          {task.priority}
                        </span>
                        <span className={`flex items-center space-x-1 ${getCategoryColor(task.category)}`}>
                          {getCategoryIcon(task.category)}
                          <span className="text-xs capitalize">{task.category.replace("_", " ")}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>

                      {task.assigned_to && (
                        <p className="text-xs text-gray-500 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          Assigned to: {task.assigned_to}
                        </p>
                      )}

                      {task.completed_date && (
                        <p className="text-xs text-green-600 flex items-center mt-1">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed: {new Date(task.completed_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateTaskStatus(activePhase, task.id, "skipped")}
                      className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-100 rounded"
                      disabled={task.status === "completed"}
                    >
                      Skip
                    </button>
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(activePhase, task.id, e.target.value as OnboardingTask["status"])}
                      className="text-xs px-2 py-1 border border-gray-300 rounded"
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Total Tasks</p>
          <p className="text-2xl font-bold text-gray-900">
            {phases.flatMap(p => p.tasks).length}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-700">
            {phases.flatMap(p => p.tasks).filter(t => t.status === "completed").length}
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs text-blue-700 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-700">
            {phases.flatMap(p => p.tasks).filter(t => t.status === "in_progress").length}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700 mb-1">Pending</p>
          <p className="text-2xl font-bold text-yellow-700">
            {phases.flatMap(p => p.tasks).filter(t => t.status === "pending").length}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-700 mb-1">Skipped</p>
          <p className="text-2xl font-bold text-gray-700">
            {phases.flatMap(p => p.tasks).filter(t => t.status === "skipped").length}
          </p>
        </div>
      </div>

      {progress === 100 && onComplete && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Complete!</h3>
          <p className="text-gray-700 mb-4">
            {employeeName} has successfully completed all onboarding tasks.
          </p>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
          >
            Mark Onboarding as Complete
          </button>
        </div>
      )}
    </div>
  );
}
