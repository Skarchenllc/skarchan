"use client";

import { ClipboardCheck, Award, Clock, CheckCircle, XCircle, AlertCircle, Eye, TrendingUp, FileText } from "lucide-react";

interface Assessment {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  test_type: "technical" | "aptitude" | "personality" | "skills" | "coding" | "other";
  test_name: string;
  test_provider: string;
  assigned_date: string;
  completion_date?: string;
  due_date?: string;
  status: "assigned" | "in_progress" | "completed" | "expired" | "not_started";
  score?: number;
  max_score?: number;
  passing_score?: number;
  percentage_score?: number;
  pass_status?: "passed" | "failed" | "pending";
  time_taken?: number; // in minutes
  time_limit?: number; // in minutes
  difficulty_level?: "easy" | "medium" | "hard";
  detailed_results?: string;
  feedback?: string;
  notes?: string;
}

interface AssessmentTabProps {
  assessments: Assessment[];
  onAssignTest?: (applicantId: string) => void;
  onViewResults?: (assessmentId: string) => void;
}

export function AssessmentTab({ assessments, onAssignTest, onViewResults }: AssessmentTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "assigned": return "bg-purple-100 text-purple-800";
      case "not_started": return "bg-yellow-100 text-yellow-800";
      case "expired": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPassStatusColor = (passStatus?: string) => {
    switch (passStatus) {
      case "passed": return "bg-green-100 text-green-800";
      case "failed": return "bg-red-100 text-red-800";
      case "pending": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getTestTypeIcon = (type: string) => {
    switch (type) {
      case "technical": return <ClipboardCheck className="w-5 h-5 text-blue-600" />;
      case "coding": return <FileText className="w-5 h-5 text-purple-600" />;
      case "aptitude": return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "skills": return <Award className="w-5 h-5 text-orange-600" />;
      default: return <ClipboardCheck className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPassStatusIcon = (passStatus?: string) => {
    switch (passStatus) {
      case "passed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed": return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending": return <Clock className="w-5 h-5 text-gray-400" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case "easy": return "bg-green-100 text-green-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "hard": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Group assessments by applicant
  const groupedAssessments = assessments.reduce((acc, assessment) => {
    if (!acc[assessment.applicant_name]) {
      acc[assessment.applicant_name] = [];
    }
    acc[assessment.applicant_name].push(assessment);
    return acc;
  }, {} as Record<string, Assessment[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Assessment & Test Results</h2>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <ClipboardCheck className="w-4 h-4" />
          <span>Assign Test</span>
        </button>
      </div>

      {assessments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assessments Yet</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAssessments).map(([applicantName, tests]) => (
            <div key={applicantName} className="bg-white rounded-lg shadow">
              {/* Applicant Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{applicantName}</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {tests.filter(t => t.status === "completed").length} / {tests.length} completed
                    </span>
                    {tests.filter(t => t.pass_status === "passed").length > 0 && (
                      <span className="text-xs text-green-600 font-medium">
                        {tests.filter(t => t.pass_status === "passed").length} passed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Assessments List */}
              <div className="divide-y">
                {tests.map((assessment) => (
                  <div key={assessment.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getTestTypeIcon(assessment.test_type)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{assessment.test_name}</h4>
                            <p className="text-sm text-gray-600">
                              {assessment.test_provider} • {assessment.test_type}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                            {assessment.status.replace("_", " ")}
                          </span>
                          {assessment.pass_status && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPassStatusColor(assessment.pass_status)}`}>
                              {assessment.pass_status}
                            </span>
                          )}
                          {assessment.difficulty_level && (
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(assessment.difficulty_level)}`}>
                              {assessment.difficulty_level}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Assigned Date</p>
                            <p className="font-medium text-gray-900">
                              {new Date(assessment.assigned_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Due Date</p>
                            <p className="font-medium text-gray-900">
                              {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Completion Date</p>
                            <p className="font-medium text-gray-900">
                              {assessment.completion_date ? new Date(assessment.completion_date).toLocaleDateString() : "Pending"}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Time Taken</p>
                            <p className="font-medium text-gray-900">
                              {assessment.time_taken ? `${assessment.time_taken} min` : "N/A"}
                              {assessment.time_limit && ` / ${assessment.time_limit} min`}
                            </p>
                          </div>
                        </div>

                        {/* Score Display */}
                        {assessment.status === "completed" && assessment.percentage_score !== undefined && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center space-x-4">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700">Score</span>
                                  <div className="flex items-center space-x-2">
                                    {getPassStatusIcon(assessment.pass_status)}
                                    <span className="text-sm font-bold text-gray-900">
                                      {assessment.percentage_score}%
                                    </span>
                                    {assessment.score !== undefined && assessment.max_score !== undefined && (
                                      <span className="text-sm text-gray-600">
                                        ({assessment.score} / {assessment.max_score})
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      assessment.pass_status === "passed"
                                        ? "bg-green-600"
                                        : assessment.pass_status === "failed"
                                        ? "bg-red-600"
                                        : "bg-blue-600"
                                    }`}
                                    style={{ width: `${assessment.percentage_score}%` }}
                                  ></div>
                                </div>
                                {assessment.passing_score !== undefined && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Passing score: {assessment.passing_score}%
                                  </p>
                                )}
                              </div>
                            </div>

                            {assessment.feedback && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Feedback:</p>
                                    <p className="text-sm text-blue-800">{assessment.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {assessment.detailed_results && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Detailed Results:</p>
                                <p className="text-sm text-gray-900">{assessment.detailed_results}</p>
                              </div>
                            )}

                            {assessment.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Internal Notes:</p>
                                <p className="text-sm text-gray-900">{assessment.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* In Progress Status */}
                        {assessment.status === "in_progress" && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-blue-600" />
                              <p className="text-sm text-blue-800">
                                Test in progress - Started on {assessment.completion_date ? new Date(assessment.completion_date).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Expired Status */}
                        {assessment.status === "expired" && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className="w-4 h-4 text-red-600" />
                              <p className="text-sm text-red-800">
                                Test expired on {assessment.due_date ? new Date(assessment.due_date).toLocaleDateString() : "N/A"}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {assessment.status === "completed" && (
                          <button
                            onClick={() => onViewResults?.(assessment.id)}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Details</span>
                          </button>
                        )}
                        {assessment.status === "assigned" && (
                          <button className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm">
                            Send Reminder
                          </button>
                        )}
                        {assessment.status === "expired" && (
                          <button className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm">
                            Reassign Test
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Tests</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{assessments.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {assessments.filter(a => a.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {assessments.filter(a => a.status === "in_progress").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Passed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {assessments.filter(a => a.pass_status === "passed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Average Score</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {assessments.filter(a => a.percentage_score !== undefined).length > 0
                ? Math.round(
                    assessments
                      .filter(a => a.percentage_score !== undefined)
                      .reduce((sum, a) => sum + (a.percentage_score || 0), 0) /
                      assessments.filter(a => a.percentage_score !== undefined).length
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
