"use client";

import { useState } from "react";
import {
  TrendingUp,
  Award,
  Target,
  Calendar,
  User,
  Star,
  ThumbsUp,
  MessageSquare,
  FileText,
  Download,
  Eye,
  ChevronRight,
} from "lucide-react";

interface PerformanceTabProps {
  employee: any;
}

interface PerformanceReview {
  id: string;
  review_period: string;
  review_date: string;
  reviewer_name: string;
  reviewer_role: string;
  overall_rating: number;
  categories: {
    name: string;
    rating: number;
    comments: string;
  }[];
  strengths: string[];
  areas_for_improvement: string[];
  goals_achieved: number;
  goals_total: number;
  status: "completed" | "pending" | "in_progress";
}

interface Feedback {
  id: string;
  from_name: string;
  from_role: string;
  date: string;
  type: "praise" | "constructive" | "general";
  message: string;
}

export default function PerformanceTab({ employee }: PerformanceTabProps) {
  const [selectedView, setSelectedView] = useState<"overview" | "reviews" | "feedback">("overview");
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);

  // Mock data - replace with actual API calls
  const performanceReviews: PerformanceReview[] = [
    {
      id: "1",
      review_period: "2025 Annual Review",
      review_date: "2026-01-15",
      reviewer_name: "Sarah Johnson",
      reviewer_role: "HR Manager",
      overall_rating: 4.5,
      categories: [
        { name: "Job Knowledge", rating: 5, comments: "Excellent understanding of role requirements" },
        { name: "Quality of Work", rating: 4, comments: "Consistently delivers high-quality results" },
        { name: "Communication", rating: 4.5, comments: "Clear and effective communicator" },
        { name: "Teamwork", rating: 5, comments: "Outstanding team collaboration" },
        { name: "Initiative", rating: 4, comments: "Shows good initiative on projects" },
      ],
      strengths: [
        "Strong technical skills",
        "Excellent team player",
        "Proactive problem solver",
        "Mentors junior team members effectively",
      ],
      areas_for_improvement: [
        "Time management on complex projects",
        "Public speaking confidence",
      ],
      goals_achieved: 8,
      goals_total: 10,
      status: "completed",
    },
    {
      id: "2",
      review_period: "Q4 2025 Review",
      review_date: "2025-10-20",
      reviewer_name: "Michael Chen",
      reviewer_role: "Team Lead",
      overall_rating: 4.2,
      categories: [
        { name: "Job Knowledge", rating: 4, comments: "Good understanding of responsibilities" },
        { name: "Quality of Work", rating: 4.5, comments: "High quality deliverables" },
        { name: "Communication", rating: 4, comments: "Communicates well with team" },
        { name: "Teamwork", rating: 4.5, comments: "Great collaboration skills" },
        { name: "Initiative", rating: 4, comments: "Takes ownership of tasks" },
      ],
      strengths: [
        "Attention to detail",
        "Reliable and consistent",
        "Quick learner",
      ],
      areas_for_improvement: [
        "Cross-functional communication",
        "Delegation skills",
      ],
      goals_achieved: 7,
      goals_total: 9,
      status: "completed",
    },
  ];

  const recentFeedback: Feedback[] = [
    {
      id: "1",
      from_name: "Emily Davis",
      from_role: "Colleague",
      date: "2026-04-10",
      type: "praise",
      message: "Great work on the Q1 presentation! Your insights were valuable and well-presented.",
    },
    {
      id: "2",
      from_name: "Michael Chen",
      from_role: "Team Lead",
      date: "2026-04-05",
      type: "constructive",
      message: "Consider breaking down large tasks into smaller milestones for better progress tracking.",
    },
    {
      id: "3",
      from_name: "Sarah Johnson",
      from_role: "HR Manager",
      date: "2026-03-28",
      type: "praise",
      message: "Your mentorship of new team members has been outstanding. Keep up the excellent work!",
    },
  ];

  // Calculate average rating
  const averageRating =
    performanceReviews.length > 0
      ? performanceReviews.reduce((sum, review) => sum + review.overall_rating, 0) / performanceReviews.length
      : 0;

  // Calculate total goals achievement
  const totalGoalsAchieved = performanceReviews.reduce((sum, review) => sum + review.goals_achieved, 0);
  const totalGoals = performanceReviews.reduce((sum, review) => sum + review.goals_total, 0);
  const goalsAchievementPercentage = totalGoals > 0 ? (totalGoalsAchieved / totalGoals) * 100 : 0;

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.floor(rating)
                ? "text-yellow-400 fill-yellow-400"
                : star - 0.5 <= rating
                ? "text-yellow-400 fill-yellow-400 opacity-50"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "praise":
        return <ThumbsUp className="w-5 h-5 text-green-600" />;
      case "constructive":
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFeedbackColor = (type: string) => {
    switch (type) {
      case "praise":
        return "border-l-green-500 bg-green-50";
      case "constructive":
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* View Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedView("overview")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === "overview"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedView("reviews")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === "reviews"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Performance Reviews ({performanceReviews.length})
          </button>
          <button
            onClick={() => setSelectedView("feedback")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedView === "feedback"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Feedback ({recentFeedback.length})
          </button>
        </div>
      </div>

      {/* Overview View */}
      {selectedView === "overview" && (
        <div className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Rating Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {averageRating.toFixed(1)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
              </div>
              {renderStars(averageRating)}
            </div>

            {/* Goals Achievement Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Goals Achieved</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {totalGoalsAchieved}/{totalGoals}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Achievement Rate</span>
                  <span className="font-medium text-green-600">
                    {goalsAchievementPercentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${goalsAchievementPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Total Reviews Card */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {performanceReviews.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Last review: {new Date(performanceReviews[0]?.review_date).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Recent Reviews */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="w-5 h-5 text-blue-600 mr-2" />
                Recent Performance Reviews
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {performanceReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{review.review_period}</h4>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          {review.status}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          Reviewed by: {review.reviewer_name} ({review.reviewer_role})
                        </p>
                        <p>Date: {new Date(review.review_date).toLocaleDateString()}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-gray-700">Overall Rating:</span>
                            {renderStars(review.overall_rating)}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              Goals: {review.goals_achieved}/{review.goals_total}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setSelectedView("reviews");
                      }}
                      className="ml-4 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition text-sm font-medium flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Feedback */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 text-blue-600 mr-2" />
                Recent Feedback
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {recentFeedback.slice(0, 3).map((feedback) => (
                <div
                  key={feedback.id}
                  className={`border-l-4 rounded-lg p-4 ${getFeedbackColor(feedback.type)}`}
                >
                  <div className="flex items-start space-x-3">
                    {getFeedbackIcon(feedback.type)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{feedback.from_name}</p>
                          <p className="text-xs text-gray-600">
                            {feedback.from_role} • {new Date(feedback.date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-2 py-1 bg-white text-xs font-medium rounded-full capitalize">
                          {feedback.type}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{feedback.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reviews View */}
      {selectedView === "reviews" && (
        <div className="space-y-6">
          {selectedReview ? (
            /* Detailed Review View */
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 flex items-center space-x-1"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  <span>Back to all reviews</span>
                </button>

                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {selectedReview.review_period}
                    </h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        Reviewed by: {selectedReview.reviewer_name} ({selectedReview.reviewer_role})
                      </p>
                      <p>Review Date: {new Date(selectedReview.review_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2">
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* Overall Rating */}
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                  {renderStars(selectedReview.overall_rating)}
                </div>

                {/* Category Ratings */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Ratings</h3>
                  <div className="space-y-4">
                    {selectedReview.categories.map((category, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">{category.name}</h4>
                          {renderStars(category.rating)}
                        </div>
                        <p className="text-sm text-gray-600">{category.comments}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals Achievement */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 text-green-600 mr-2" />
                    Goals Achievement
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {selectedReview.goals_achieved} of {selectedReview.goals_total} goals achieved
                      </span>
                      <span className="text-sm font-medium text-green-600">
                        {((selectedReview.goals_achieved / selectedReview.goals_total) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${(selectedReview.goals_achieved / selectedReview.goals_total) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Strengths</h3>
                  <ul className="space-y-2">
                    {selectedReview.strengths.map((strength, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <ThumbsUp className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Areas for Improvement</h3>
                  <ul className="space-y-2">
                    {selectedReview.areas_for_improvement.map((area, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Reviews List */
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">All Performance Reviews</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {performanceReviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setSelectedReview(review)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{review.review_period}</h4>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {review.status}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            Reviewed by: {review.reviewer_name} ({review.reviewer_role})
                          </p>
                          <p>Date: {new Date(review.review_date).toLocaleDateString()}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-700">Overall Rating:</span>
                              {renderStars(review.overall_rating)}
                            </div>
                            <div className="flex items-center space-x-1">
                              <Target className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">
                                Goals: {review.goals_achieved}/{review.goals_total}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback View */}
      {selectedView === "feedback" && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Feedback</h3>
          </div>
          <div className="p-6 space-y-4">
            {recentFeedback.map((feedback) => (
              <div
                key={feedback.id}
                className={`border-l-4 rounded-lg p-4 ${getFeedbackColor(feedback.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getFeedbackIcon(feedback.type)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{feedback.from_name}</p>
                        <p className="text-xs text-gray-600">
                          {feedback.from_role} • {new Date(feedback.date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-white text-xs font-medium rounded-full capitalize">
                        {feedback.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{feedback.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
