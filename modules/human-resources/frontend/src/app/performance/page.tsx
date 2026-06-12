"use client";

import { useState, useEffect } from "react";
import {
  Award,
  TrendingUp,
  Users,
  Star,
  Calendar,
  FileText,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface PerformanceReview {
  id: string;
  employee_id: string;
  reviewer_id: string;
  review_date: string;
  review_period_start: string;
  review_period_end: string;
  overall_rating?: number;
  goals_rating?: number;
  skills_rating?: number;
  attendance_rating?: number;
  comments?: string;
  strengths?: string;
  areas_for_improvement?: string;
  goals_next_period?: string;
  is_finalized: boolean;
}

export default function PerformancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
    loadReviews();
  }, []);

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const loadReviews = async () => {
    try {
      const res = await fetch("/api/hr/performance-reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error("Failed to load reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-gray-400";
    if (rating >= 4.5) return "text-gray-900";
    if (rating >= 3.5) return "text-gray-900";
    if (rating >= 2.5) return "text-gray-900";
    return "text-red-600";
  };

  const renderStars = (rating?: number) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-5 h-5 ${i < fullStars ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
        />
      );
    }
    return stars;
  };

  const stats = {
    total: reviews.length,
    finalized: reviews.filter(r => r.is_finalized).length,
    pending: reviews.filter(r => !r.is_finalized).length,
    avgRating: reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length).toFixed(1)
      : "0.0",
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Performance Reviews</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Reviews:</span> {stats.total}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Finalized:</span> {stats.finalized}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Pending:</span> {stats.pending}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Avg Rating:</span> {stats.avgRating}
            </div>
          </div>

          {/* Performance Reviews List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading performance reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No performance reviews found</p>
                <p className="text-sm text-gray-400">Performance reviews will appear here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="border rounded-lg p-6 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getEmployeeName(review.employee_id)}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Review Period: {new Date(review.review_period_start).toLocaleDateString()} - {new Date(review.review_period_end).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Reviewed by: {getEmployeeName(review.reviewer_id)} on {new Date(review.review_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${review.is_finalized ? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800"}`}>
                          {review.is_finalized ? "Finalized" : "Draft"}
                        </span>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Overall Rating</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(review.overall_rating)}</div>
                          <span className={`text-lg font-bold ${getRatingColor(review.overall_rating)}`}>
                            {review.overall_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Goals</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(review.goals_rating)}</div>
                          <span className={`text-lg font-bold ${getRatingColor(review.goals_rating)}`}>
                            {review.goals_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Skills</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(review.skills_rating)}</div>
                          <span className={`text-lg font-bold ${getRatingColor(review.skills_rating)}`}>
                            {review.skills_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-2">Attendance</p>
                        <div className="flex items-center space-x-2">
                          <div className="flex">{renderStars(review.attendance_rating)}</div>
                          <span className={`text-lg font-bold ${getRatingColor(review.attendance_rating)}`}>
                            {review.attendance_rating?.toFixed(1) || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Comments */}
                    {review.comments && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">Comments</p>
                        <p className="text-sm text-gray-600 mt-1">{review.comments}</p>
                      </div>
                    )}

                    {review.strengths && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">Strengths</p>
                        <p className="text-sm text-gray-600 mt-1">{review.strengths}</p>
                      </div>
                    )}

                    {review.areas_for_improvement && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-900">Areas for Improvement</p>
                        <p className="text-sm text-gray-600 mt-1">{review.areas_for_improvement}</p>
                      </div>
                    )}

                    {review.goals_next_period && (
                      <div>
                        <p className="text-sm font-medium text-gray-900">Goals for Next Period</p>
                        <p className="text-sm text-gray-600 mt-1">{review.goals_next_period}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
