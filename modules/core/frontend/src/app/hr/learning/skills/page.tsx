"use client";

import { useState } from "react";
import Link from "next/link";
import Navigation from "@/components/hr/Navigation";
import {
  Target,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  CheckCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";

export default function SkillsAssessmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  const skillsData = [
    {
      category: "Technical Skills",
      skills: [
        {
          name: "JavaScript/TypeScript",
          avgProficiency: 75,
          employees: 42,
          trend: "up",
          gap: 15,
          critical: false,
        },
        {
          name: "Python",
          avgProficiency: 60,
          employees: 28,
          trend: "up",
          gap: 25,
          critical: true,
        },
        {
          name: "React/Next.js",
          avgProficiency: 70,
          employees: 35,
          trend: "stable",
          gap: 20,
          critical: false,
        },
        {
          name: "Database Management",
          avgProficiency: 55,
          employees: 30,
          trend: "down",
          gap: 35,
          critical: true,
        },
      ],
    },
    {
      category: "Soft Skills",
      skills: [
        {
          name: "Leadership",
          avgProficiency: 65,
          employees: 45,
          trend: "up",
          gap: 25,
          critical: false,
        },
        {
          name: "Communication",
          avgProficiency: 80,
          employees: 68,
          trend: "stable",
          gap: 10,
          critical: false,
        },
        {
          name: "Problem Solving",
          avgProficiency: 70,
          employees: 52,
          trend: "up",
          gap: 20,
          critical: false,
        },
        {
          name: "Time Management",
          avgProficiency: 60,
          employees: 48,
          trend: "stable",
          gap: 30,
          critical: true,
        },
      ],
    },
    {
      category: "Business Skills",
      skills: [
        {
          name: "Project Management",
          avgProficiency: 58,
          employees: 32,
          trend: "up",
          gap: 32,
          critical: true,
        },
        {
          name: "Data Analysis",
          avgProficiency: 62,
          employees: 38,
          trend: "up",
          gap: 28,
          critical: false,
        },
        {
          name: "Strategic Planning",
          avgProficiency: 50,
          employees: 22,
          trend: "stable",
          gap: 40,
          critical: true,
        },
      ],
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProficiencyColor = (proficiency: number) => {
    if (proficiency >= 75) return "text-blue-600 bg-blue-100";
    if (proficiency >= 60) return "text-blue-600 bg-blue-100";
    return "text-blue-600 bg-blue-100";
  };

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Skills Matrix & Assessment</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Total Skills Tracked:</span> {skillsData.reduce((sum, cat) => sum + cat.skills.length, 0)}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Avg Proficiency:</span> {Math.round(skillsData.reduce((sum, cat) => sum + cat.skills.reduce((s, skill) => s + skill.avgProficiency, 0), 0) / skillsData.reduce((sum, cat) => sum + cat.skills.length, 0))}%
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Critical Gaps:</span> {skillsData.reduce((sum, cat) => sum + cat.skills.filter(s => s.critical).length, 0)}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Employees Assessed:</span> 82
            </div>
          </div>

          
          {/* Search and Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="Technical Skills">Technical Skills</option>
                  <option value="Soft Skills">Soft Skills</option>
                  <option value="Business Skills">Business Skills</option>
                </select>
              </div>
            </div>
          </div>

          {/* Skills Matrix */}
          <div className="p-6">
            <div className="space-y-6">
              {skillsData
                .filter(cat => filterCategory === "all" || cat.category === filterCategory)
                .map((category) => (
                  <div key={category.category} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
                      <h2 className="text-lg font-semibold text-gray-900">{category.category}</h2>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Skill Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Avg Proficiency</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Employees</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Trend</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Skill Gap</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {category.skills
                            .filter(skill =>
                              searchTerm === "" ||
                              skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((skill) => (
                              <tr key={skill.name} className="hover:bg-blue-50 transition">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-300 bg-white">
                                  {skill.name}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 bg-white">
                                  <div className="flex items-center space-x-3">
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                          className="bg-blue-600 h-2 rounded-full"
                                          style={{ width: `${skill.avgProficiency}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className={`text-sm font-semibold px-2 py-1 rounded ${getProficiencyColor(skill.avgProficiency)}`}>
                                      {skill.avgProficiency}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 border border-gray-300 bg-white">
                                  <div className="flex items-center space-x-1">
                                    <Users className="w-4 h-4" />
                                    <span>{skill.employees}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 border border-gray-300 bg-white">
                                  {getTrendIcon(skill.trend)}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 bg-white">
                                  <span className="text-sm font-medium text-gray-900">
                                    {skill.gap}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 border border-gray-300 bg-white">
                                  {skill.critical ? (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1 w-fit">
                                      <AlertTriangle className="w-3 h-3" />
                                      <span>Critical</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1 w-fit">
                                      <CheckCircle className="w-3 h-3" />
                                      <span>Good</span>
                                    </span>
                                  )}
                                </td>
                                <td className="px-6 py-4 border border-gray-300 bg-white">
                                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
