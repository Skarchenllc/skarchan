"use client";

import { MessageSquare, ThumbsUp, ThumbsDown, Star, User, Calendar, Clock, CheckCircle, AlertCircle, Eye, Plus } from "lucide-react";
import { useState } from "react";

interface InterviewFeedback {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  interview_id: string;
  interview_stage: string;
  interview_date: string;
  interviewer_name: string;
  interviewer_email: string;
  submitted_date?: string;
  overall_rating: number; // 1-5
  technical_skills?: number; // 1-5
  communication_skills?: number; // 1-5
  problem_solving?: number; // 1-5
  cultural_fit?: number; // 1-5
  experience_level?: number; // 1-5
  recommendation: "strong_yes" | "yes" | "maybe" | "no" | "strong_no";
  strengths?: string;
  weaknesses?: string;
  detailed_feedback?: string;
  questions_asked?: string;
  candidate_questions?: string;
  notes?: string;
  status: "pending" | "submitted" | "reviewed";
}

interface InterviewFeedbackTabProps {
  feedbacks: InterviewFeedback[];
  onSubmitFeedback?: (interviewId: string) => void;
  onViewFeedback?: (feedbackId: string) => void;
}

export function InterviewFeedbackTab({ feedbacks, onSubmitFeedback, onViewFeedback }: InterviewFeedbackTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case "strong_yes": return "bg-green-600 text-white";
      case "yes": return "bg-green-100 text-green-800";
      case "maybe": return "bg-yellow-100 text-yellow-800";
      case "no": return "bg-red-100 text-red-800";
      case "strong_no": return "bg-red-600 text-white";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case "strong_yes":
      case "yes":
        return <ThumbsUp className="w-4 h-4" />;
      case "no":
      case "strong_no":
        return <ThumbsDown className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "bg-green-100 text-green-800";
      case "reviewed": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderStarRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/5)</span>
      </div>
    );
  };

  // Group feedbacks by applicant
  const groupedFeedbacks = feedbacks.reduce((acc, feedback) => {
    if (!acc[feedback.applicant_name]) {
      acc[feedback.applicant_name] = [];
    }
    acc[feedback.applicant_name].push(feedback);
    return acc;
  }, {} as Record<string, InterviewFeedback[]>);

  // Calculate average rating for an applicant
  const calculateAverageRating = (applicantFeedbacks: InterviewFeedback[]) => {
    const submittedFeedbacks = applicantFeedbacks.filter(f => f.status === "submitted" || f.status === "reviewed");
    if (submittedFeedbacks.length === 0) return 0;
    const sum = submittedFeedbacks.reduce((acc, f) => acc + f.overall_rating, 0);
    return (sum / submittedFeedbacks.length).toFixed(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interview Feedback</h2>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          <span>Request Feedback</span>
        </button>
      </div>

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Feedback Yet</h3>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedFeedbacks).map(([applicantName, applicantFeedbacks]) => (
            <div key={applicantName} className="bg-white rounded-lg shadow">
              {/* Applicant Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{applicantName}</h3>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Average Rating</p>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-bold text-gray-900">
                          {calculateAverageRating(applicantFeedbacks)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Submitted</p>
                      <span className="text-sm font-medium text-gray-900">
                        {applicantFeedbacks.filter(f => f.status === "submitted" || f.status === "reviewed").length} / {applicantFeedbacks.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Feedbacks List */}
              <div className="divide-y">
                {applicantFeedbacks.map((feedback) => (
                  <div key={feedback.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <User className="w-5 h-5 text-gray-600" />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">{feedback.interviewer_name}</h4>
                              <span className="text-sm text-gray-500">•</span>
                              <span className="text-sm text-gray-600">{feedback.interview_stage}</span>
                            </div>
                            <p className="text-sm text-gray-500">{feedback.interviewer_email}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(feedback.status)}`}>
                            {feedback.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Interview Date</p>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <p className="font-medium text-gray-900">
                                {new Date(feedback.interview_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-gray-600">Submitted Date</p>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <p className="font-medium text-gray-900">
                                {feedback.submitted_date ? new Date(feedback.submitted_date).toLocaleDateString() : "Pending"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Feedback Details (for submitted feedbacks) */}
                        {(feedback.status === "submitted" || feedback.status === "reviewed") && (
                          <div className="mt-4 space-y-4">
                            {/* Overall Rating and Recommendation */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
                                {renderStarRating(feedback.overall_rating)}
                              </div>
                              <div>
                                <p className="text-sm text-gray-600 mb-2 text-right">Recommendation</p>
                                <span className={`inline-flex items-center space-x-1 px-3 py-1.5 text-sm font-semibold rounded-full ${getRecommendationColor(feedback.recommendation)}`}>
                                  {getRecommendationIcon(feedback.recommendation)}
                                  <span>{feedback.recommendation.replace(/_/g, " ")}</span>
                                </span>
                              </div>
                            </div>

                            {/* Skill Ratings */}
                            {(feedback.technical_skills || feedback.communication_skills || feedback.problem_solving ||
                              feedback.cultural_fit || feedback.experience_level) && (
                              <div className="grid grid-cols-2 gap-4">
                                {feedback.technical_skills !== undefined && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Technical Skills</p>
                                    {renderStarRating(feedback.technical_skills)}
                                  </div>
                                )}
                                {feedback.communication_skills !== undefined && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Communication</p>
                                    {renderStarRating(feedback.communication_skills)}
                                  </div>
                                )}
                                {feedback.problem_solving !== undefined && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Problem Solving</p>
                                    {renderStarRating(feedback.problem_solving)}
                                  </div>
                                )}
                                {feedback.cultural_fit !== undefined && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Cultural Fit</p>
                                    {renderStarRating(feedback.cultural_fit)}
                                  </div>
                                )}
                                {feedback.experience_level !== undefined && (
                                  <div>
                                    <p className="text-sm text-gray-600 mb-1">Experience Level</p>
                                    {renderStarRating(feedback.experience_level)}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Toggle for detailed feedback */}
                            {(feedback.strengths || feedback.weaknesses || feedback.detailed_feedback) && (
                              <div>
                                <button
                                  onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                                >
                                  <span>{expandedId === feedback.id ? "Hide" : "Show"} Detailed Feedback</span>
                                  <svg
                                    className={`w-4 h-4 transform transition-transform ${expandedId === feedback.id ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {expandedId === feedback.id && (
                                  <div className="mt-3 space-y-3">
                                    {feedback.strengths && (
                                      <div className="p-3 bg-green-50 rounded-lg">
                                        <p className="text-sm font-medium text-green-900 mb-1">Strengths:</p>
                                        <p className="text-sm text-green-800">{feedback.strengths}</p>
                                      </div>
                                    )}
                                    {feedback.weaknesses && (
                                      <div className="p-3 bg-red-50 rounded-lg">
                                        <p className="text-sm font-medium text-red-900 mb-1">Areas for Improvement:</p>
                                        <p className="text-sm text-red-800">{feedback.weaknesses}</p>
                                      </div>
                                    )}
                                    {feedback.detailed_feedback && (
                                      <div className="p-3 bg-blue-50 rounded-lg">
                                        <p className="text-sm font-medium text-blue-900 mb-1">Detailed Feedback:</p>
                                        <p className="text-sm text-blue-800">{feedback.detailed_feedback}</p>
                                      </div>
                                    )}
                                    {feedback.questions_asked && (
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Questions Asked:</p>
                                        <p className="text-sm text-gray-700">{feedback.questions_asked}</p>
                                      </div>
                                    )}
                                    {feedback.candidate_questions && (
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Candidate's Questions:</p>
                                        <p className="text-sm text-gray-700">{feedback.candidate_questions}</p>
                                      </div>
                                    )}
                                    {feedback.notes && (
                                      <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 mb-1">Additional Notes:</p>
                                        <p className="text-sm text-gray-700">{feedback.notes}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Pending Status */}
                        {feedback.status === "pending" && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-yellow-600" />
                              <p className="text-sm text-yellow-800">
                                Awaiting feedback submission from interviewer
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {(feedback.status === "submitted" || feedback.status === "reviewed") && (
                          <button
                            onClick={() => onViewFeedback?.(feedback.id)}
                            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center space-x-1"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Full</span>
                          </button>
                        )}
                        {feedback.status === "pending" && (
                          <button className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm">
                            Send Reminder
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
      {feedbacks.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Feedbacks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{feedbacks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Submitted</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {feedbacks.filter(f => f.status === "submitted" || f.status === "reviewed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {feedbacks.filter(f => f.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Strong Yes</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {feedbacks.filter(f => f.recommendation === "strong_yes").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Avg. Rating</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {feedbacks.filter(f => f.status === "submitted" || f.status === "reviewed").length > 0
                ? (
                    feedbacks
                      .filter(f => f.status === "submitted" || f.status === "reviewed")
                      .reduce((sum, f) => sum + f.overall_rating, 0) /
                    feedbacks.filter(f => f.status === "submitted" || f.status === "reviewed").length
                  ).toFixed(1)
                : "0"}
              /5
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
