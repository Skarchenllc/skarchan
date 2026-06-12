"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Target,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  User,
  FileText,
  BarChart3,
  MessageSquare,
  Edit,
} from "lucide-react";
import EmployeePortalHeader from "@/components/EmployeePortalHeader";

interface Goal {
  id: string;
  title: string;
  description: string;
  category: "individual" | "team" | "company";
  status: "not_started" | "in_progress" | "completed" | "blocked";
  progress: number;
  target_date: string;
  created_at: string;
}

interface PerformanceReview {
  id: string;
  review_period: string;
  review_type: "annual" | "mid_year" | "quarterly" | "probation";
  status: "pending" | "self_assessment_complete" | "manager_review_complete" | "completed";
  self_rating?: number;
  manager_rating?: number;
  overall_rating?: number;
  due_date: string;
  completed_date?: string;
  reviewer_name?: string;
}

interface Feedback {
  id: string;
  from_name: string;
  feedback_type: "praise" | "constructive" | "peer_review";
  category: string;
  message: string;
  date: string;
  is_read: boolean;
}

export default function PerformancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "goals" | "reviews" | "feedback">("overview");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSelfAssessmentModal, setShowSelfAssessmentModal] = useState(false);

  const [goalForm, setGoalForm] = useState({
    title: "",
    description: "",
    category: "individual" as "individual" | "team" | "company",
    target_date: "",
  });

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
      // Mock goals data
      const mockGoals: Goal[] = [
        {
          id: "1",
          title: "Complete React Advanced Training",
          description: "Finish the advanced React course and implement learnings in current project",
          category: "individual",
          status: "in_progress",
          progress: 65,
          target_date: "2026-06-30",
          created_at: "2026-01-15",
        },
        {
          id: "2",
          title: "Reduce Bug Count by 30%",
          description: "Improve code quality and reduce production bugs through better testing",
          category: "individual",
          status: "in_progress",
          progress: 45,
          target_date: "2026-12-31",
          created_at: "2026-01-01",
        },
        {
          id: "3",
          title: "Launch New Mobile App",
          description: "Successfully deliver mobile app to production with team",
          category: "team",
          status: "in_progress",
          progress: 80,
          target_date: "2026-05-15",
          created_at: "2026-02-01",
        },
        {
          id: "4",
          title: "Mentor Junior Developer",
          description: "Provide weekly mentoring sessions to new team member",
          category: "individual",
          status: "completed",
          progress: 100,
          target_date: "2026-03-31",
          created_at: "2026-01-01",
        },
      ];
      setGoals(mockGoals);

      // Mock performance reviews
      const mockReviews: PerformanceReview[] = [
        {
          id: "1",
          review_period: "Q1 2026",
          review_type: "quarterly",
          status: "pending",
          due_date: "2026-04-15",
          reviewer_name: "Sarah Johnson",
        },
        {
          id: "2",
          review_period: "2025 Annual Review",
          review_type: "annual",
          status: "completed",
          self_rating: 4,
          manager_rating: 4.5,
          overall_rating: 4.3,
          due_date: "2025-12-31",
          completed_date: "2025-12-20",
          reviewer_name: "Sarah Johnson",
        },
      ];
      setReviews(mockReviews);

      // Mock feedback
      const mockFeedback: Feedback[] = [
        {
          id: "1",
          from_name: "Sarah Johnson",
          feedback_type: "praise",
          category: "Technical Excellence",
          message: "Excellent work on the API optimization project. Performance improved by 40%!",
          date: "2026-04-05",
          is_read: false,
        },
        {
          id: "2",
          from_name: "Mike Chen",
          feedback_type: "peer_review",
          category: "Collaboration",
          message: "Great teamwork during the sprint. Really appreciated your help with code reviews.",
          date: "2026-04-01",
          is_read: true,
        },
        {
          id: "3",
          from_name: "Sarah Johnson",
          feedback_type: "constructive",
          category: "Communication",
          message: "Consider providing more detailed documentation for complex features.",
          date: "2026-03-28",
          is_read: true,
        },
      ];
      setFeedback(mockFeedback);
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "not_started":
        return "bg-gray-100 text-gray-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getReviewStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "self_assessment_complete":
        return "bg-blue-100 text-blue-800";
      case "manager_review_complete":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case "praise":
        return <Award className="w-5 h-5 text-yellow-500" />;
      case "constructive":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "peer_review":
        return <Star className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const handleAddGoal = () => {
    if (!goalForm.title || !goalForm.target_date) {
      alert("Please fill in all required fields");
      return;
    }

    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalForm.title,
      description: goalForm.description,
      category: goalForm.category,
      status: "not_started",
      progress: 0,
      target_date: goalForm.target_date,
      created_at: new Date().toISOString(),
    };

    setGoals([newGoal, ...goals]);
    setShowGoalModal(false);
    setGoalForm({ title: "", description: "", category: "individual", target_date: "" });
  };

  const handleUpdateProgress = (goalId: string, newProgress: number) => {
    setGoals(
      goals.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              progress: newProgress,
              status: newProgress === 100 ? "completed" : newProgress > 0 ? "in_progress" : "not_started",
            }
          : goal
      )
    );
  };

  const pendingReview = reviews.find((r) => r.status === "pending");
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const inProgressGoals = goals.filter((g) => g.status === "in_progress").length;
  const unreadFeedback = feedback.filter((f) => !f.is_read).length;
  const averageProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading performance data...</p>
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
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Performance & Development</h1>
            <span className="text-gray-400">|</span>
            <p className="text-sm text-gray-600">Track your goals, reviews, and growth</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "overview"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("goals")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "goals"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Goals ({goals.length})
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "reviews"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab("feedback")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "feedback"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Feedback ({unreadFeedback > 0 ? unreadFeedback : feedback.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Goals</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{inProgressGoals}</p>
                    <p className="text-xs text-gray-500 mt-1">in progress</p>
                  </div>
                  <Target className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completed Goals</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{completedGoals}</p>
                    <p className="text-xs text-gray-500 mt-1">this year</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Progress</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">{averageProgress}%</p>
                    <p className="text-xs text-gray-500 mt-1">across all goals</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">New Feedback</p>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{unreadFeedback}</p>
                    <p className="text-xs text-gray-500 mt-1">unread items</p>
                  </div>
                  <MessageSquare className="w-12 h-12 text-orange-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Pending Review Alert */}
            {pendingReview && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-yellow-800">
                      Performance Review Pending
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Your {pendingReview.review_period} {pendingReview.review_type} review is due on{" "}
                      {new Date(pendingReview.due_date).toLocaleDateString()}. Please complete your
                      self-assessment.
                    </p>
                    <button
                      onClick={() => setShowSelfAssessmentModal(true)}
                      className="mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
                    >
                      Start Self-Assessment
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Goals */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Active Goals</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {goals
                      .filter((g) => g.status === "in_progress")
                      .slice(0, 3)
                      .map((goal) => (
                        <div key={goal.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{goal.title}</h4>
                            <span
                              className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                                goal.status
                              )}`}
                            >
                              {goal.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${goal.progress}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Due: {new Date(goal.target_date).toLocaleDateString()}</span>
                            <span className="capitalize">{goal.category}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  <button
                    onClick={() => setActiveTab("goals")}
                    className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Goals
                  </button>
                </div>
              </div>

              {/* Recent Feedback */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold">Recent Feedback</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {feedback.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className={`border rounded-lg p-4 ${!item.is_read ? "bg-blue-50 border-blue-200" : ""}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getFeedbackIcon(item.feedback_type)}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-gray-900">{item.from_name}</p>
                              {!item.is_read && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{item.message}</p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span className="capitalize">{item.category}</span>
                              <span>{new Date(item.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveTab("feedback")}
                    className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View All Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Goals</h2>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Goal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {goals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{goal.title}</h3>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            goal.status
                          )}`}
                        >
                          {goal.status.replace("_", " ")}
                        </span>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800 capitalize">
                          {goal.category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{goal.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold text-gray-900">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Target: {new Date(goal.target_date).toLocaleDateString()}
                        </span>
                        <span>
                          Created: {new Date(goal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {goal.status !== "completed" && (
                        <div className="flex items-center space-x-2">
                          <span>Update:</span>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={goal.progress}
                            onChange={(e) => handleUpdateProgress(goal.id, parseInt(e.target.value))}
                            className="w-24"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Performance Reviews</h2>

            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{review.review_period}</h3>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 capitalize">
                          {review.review_type.replace("_", " ")}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getReviewStatusColor(
                            review.status
                          )}`}
                        >
                          {review.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Reviewer: {review.reviewer_name}</p>
                    </div>

                    {review.status === "pending" && (
                      <button
                        onClick={() => setShowSelfAssessmentModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                      >
                        Start Assessment
                      </button>
                    )}
                  </div>

                  {review.status === "completed" && review.overall_rating && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Self Rating</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="ml-1 font-semibold">{review.self_rating}/5</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Manager Rating</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="ml-1 font-semibold">{review.manager_rating}/5</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Overall Rating</p>
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="ml-1 font-semibold text-blue-600">{review.overall_rating}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Due: {new Date(review.due_date).toLocaleDateString()}</span>
                    {review.completed_date && (
                      <span>Completed: {new Date(review.completed_date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === "feedback" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold">Feedback & Recognition</h2>

            <div className="space-y-4">
              {feedback.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white rounded-lg shadow p-6 ${
                    !item.is_read ? "border-l-4 border-blue-600" : ""
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-gray-100 rounded-full">{getFeedbackIcon(item.feedback_type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{item.from_name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              item.feedback_type === "praise"
                                ? "bg-yellow-100 text-yellow-800"
                                : item.feedback_type === "constructive"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {item.feedback_type.replace("_", " ")}
                          </span>
                          {!item.is_read && (
                            <div className="flex items-center justify-end mt-1">
                              <span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span>
                              <span className="text-xs text-blue-600">New</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{item.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Add New Goal</h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                  placeholder="e.g., Complete certification course"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                  placeholder="Describe what you want to achieve..."
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={goalForm.category}
                    onChange={(e) =>
                      setGoalForm({
                        ...goalForm,
                        category: e.target.value as "individual" | "team" | "company",
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="individual">Individual</option>
                    <option value="team">Team</option>
                    <option value="company">Company</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={goalForm.target_date}
                    onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowGoalModal(false)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Self-Assessment Modal (Placeholder) */}
      {showSelfAssessmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Self-Assessment</h2>
              <p className="text-sm text-gray-500 mt-1">{pendingReview?.review_period} - {pendingReview?.review_type}</p>
            </div>

            <div className="p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  This is a placeholder for the self-assessment form. In a full implementation, this
                  would include rating scales, competency assessments, and open-ended questions.
                </p>
              </div>

              <button
                onClick={() => setShowSelfAssessmentModal(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
