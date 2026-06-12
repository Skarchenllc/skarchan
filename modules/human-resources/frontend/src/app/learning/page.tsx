"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  GraduationCap,
  BookOpen,
  Award,
  Target,
  Users,
  Clock,
  TrendingUp,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

export default function LearningPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "programs" | "skills" | "certifications">("overview");

  // Sample data
  const stats = {
    totalPrograms: 24,
    activeEnrollments: 156,
    completionRate: 78,
    avgRating: 4.6,
  };

  const recentPrograms = [
    {
      id: 1,
      title: "Leadership Development Program",
      category: "Management",
      duration: "6 weeks",
      enrolled: 32,
      completed: 18,
      status: "ongoing",
      startDate: "2026-03-15",
    },
    {
      id: 2,
      title: "Technical Skills Bootcamp",
      category: "Technical",
      duration: "4 weeks",
      enrolled: 45,
      completed: 45,
      status: "completed",
      startDate: "2026-02-01",
    },
    {
      id: 3,
      title: "Communication & Presentation Skills",
      category: "Soft Skills",
      duration: "3 weeks",
      enrolled: 28,
      completed: 12,
      status: "ongoing",
      startDate: "2026-03-20",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Learning & Development</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Programs:</span> {stats.totalPrograms}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Active Enrollments:</span> {stats.activeEnrollments}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Completion Rate:</span> {stats.completionRate}%
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Average Rating:</span> {stats.avgRating}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Link href="/learning/training" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
              New Training Program
            </Link>
          </div>

          {/* Tabs Navigation */}
          <div className="flex space-x-8 px-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("overview")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "overview"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("programs")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "programs"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Training Programs
              </button>
              <button
                onClick={() => setActiveTab("skills")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "skills"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Skills Matrix
              </button>
              <button
                onClick={() => setActiveTab("certifications")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "certifications"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Certifications
              </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Training Programs</h2>

                {/* Programs List */}
                <div className="space-y-4">
                  {recentPrograms.map((program) => (
                    <div key={program.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-base font-semibold text-gray-900">{program.title}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              program.status === "ongoing"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}>
                              {program.status === "ongoing" ? "Ongoing" : "Completed"}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              {program.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{program.duration}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{program.enrolled} enrolled</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>{program.completed} completed</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Started: {new Date(program.startDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <Link
                          href={`/learning/training/${program.id}`}
                          className="px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition"
                        >
                          View Details
                        </Link>
                      </div>

                      {/* Progress Bar */}
                      {program.status === "ongoing" && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Completion Progress</span>
                            <span>{Math.round((program.completed / program.enrolled) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${(program.completed / program.enrolled) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4">
                  <Link
                    href="/learning/training"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span>View All Training Programs</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}

            {activeTab === "programs" && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Training Programs Module</h3>
                <p className="text-gray-500 mb-6">Manage all employee training programs and courses</p>
                <Link
                  href="/learning/training"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Training Program</span>
                </Link>
              </div>
            )}

            {activeTab === "skills" && (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Skills Assessment Module</h3>
                <p className="text-gray-500 mb-6">Track employee skills, identify gaps, and plan development</p>
                <Link
                  href="/learning/skills"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Assess Skills</span>
                </Link>
              </div>
            )}

            {activeTab === "certifications" && (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Certifications Management</h3>
                <p className="text-gray-500 mb-6">Track professional certifications and renewal dates</p>
                <Link
                  href="/learning/certifications"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Certification</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
