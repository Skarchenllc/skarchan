"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  Plus,
  Search,
  Filter,
  Briefcase,
  Users,
  Calendar,
  FileText,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

interface JobRequisition {
  id: string;
  job_title: string;
  department: string;
  location: string;
  employment_type: "full_time" | "part_time" | "contract" | "internship";
  status: "draft" | "open" | "on_hold" | "filled" | "cancelled";
  positions: number;
  salary_range_min: number;
  salary_range_max: number;
  posted_date?: string;
  closing_date?: string;
  applicants_count: number;
  interviews_scheduled: number;
  offers_made: number;

  // Job Description
  job_summary?: string;
  key_responsibilities?: string[];

  // Requirements
  required_education?: string;
  preferred_education?: string;
  min_experience_years?: number;
  max_experience_years?: number;
  age_min?: number;
  age_max?: number;

  // Skills & Competencies
  required_skills?: string[];
  preferred_skills?: string[];
  certifications?: string[];
  languages?: string[];

  // Work Conditions
  work_schedule?: string;
  travel_required?: string;
  physical_requirements?: string;

  // Benefits & Perks
  benefits?: string[];

  // Interview Process
  interview_stages?: string[];

  // Onboarding
  onboarding_duration?: number; // in days
  training_required?: string[];
}


export default function RecruitmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<JobRequisition[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch("/api/hr/recruitment/job-requisitions");
      if (!response.ok) {
        throw new Error("Failed to fetch job requisitions");
      }
      const data = await response.json();

      // Transform the data to match the JobRequisition interface
      const transformedJobs = data.map((job: any) => ({
        ...job,
        key_responsibilities: job.key_responsibilities_list || [],
        required_skills: job.required_skills_list || [],
        preferred_skills: job.preferred_skills_list || [],
        certifications: job.certifications_list || [],
        languages: job.languages_list || [],
        benefits: job.benefits_list || [],
        interview_stages: job.interview_stages_list || [],
        training_required: job.training_required_list || [],
      }));

      setJobs(transformedJobs);
    } catch (err) {
      console.error("Failed to load data", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${jobTitle}"?\n\nThis action cannot be undone and will remove all applicants and data associated with this job.`)) {
      try {
        // Call API to delete from backend
        const response = await fetch(`/api/hr/recruitment/job-requisitions/${jobId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete job requisition');
        }

        //Remove from state only if backend deletion succeeds
        setJobs(jobs.filter(j => j.id !== jobId));

        // Show success message
        alert(`Job "${jobTitle}" has been deleted successfully.`);

        // Reload data to ensure consistency
        await loadData();
      } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "filled":
        return "bg-blue-100 text-blue-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status?.toLowerCase() === statusFilter?.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const openJobs = jobs.filter((j) => j.status?.toLowerCase() === "open").length;
  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicants_count, 0);
  const totalInterviews = jobs.reduce((sum, j) => sum + j.interviews_scheduled, 0);
  const totalOffers = jobs.reduce((sum, j) => sum + j.offers_made, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading recruitment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Recruitment & Hiring</h1>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Open Positions:</span> {openJobs}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Total Applicants:</span> {totalApplicants}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Interviews Scheduled:</span> {totalInterviews}
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Offers Made:</span> {totalOffers}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-4 border-b border-gray-200">
            <Link href="/recruitment/new" className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
              New Job Requisition
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="p-6 border-b border-gray-200">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search jobs by title or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="relative">
                  <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="filled">Filled</option>
                    <option value="on_hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
          </div>

          {/* Jobs List */}
          <div className="space-y-4 p-6">
              {filteredJobs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Job Requisitions Found</h3>
                  <p className="text-gray-500 mb-6">
                    {jobs.length === 0
                      ? "Get started by creating your first job requisition."
                      : "No jobs match your current filters. Try adjusting your search criteria."}
                  </p>
                  {jobs.length === 0 && (
                    <Link
                      href="/recruitment/new"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Plus className="w-5 h-5" />
                      <span>Create Job Requisition</span>
                    </Link>
                  )}
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className="bg-white border-2 border-blue-500 rounded-lg shadow hover:shadow-lg transition p-5">
                    {/* Row 1: Job Heading, Analytics, and Action Buttons */}
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-2xl font-bold text-gray-900">{job.job_title}</h2>

                      {/* Analytics in Center - Inline */}
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <span className="text-2xl font-bold text-blue-600">{job.applicants_count}</span>
                          <span className="text-sm text-gray-600">Applicants</span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xl font-bold text-blue-600">{job.interviews_scheduled}</span>
                          <span className="text-sm text-gray-600">Interviews</span>
                        </div>
                        <span className="text-gray-400">|</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-2xl font-bold text-blue-600">{job.offers_made}</span>
                          <span className="text-sm text-gray-600">Offers</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/recruitment/jobs/${job.id}`}
                          className="p-2 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5 text-blue-600" />
                        </Link>
                        <Link
                          href={`/recruitment/new?id=${job.id}`}
                          className="p-2 border border-blue-400 rounded-lg hover:bg-blue-50 transition"
                          title="Edit Job"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                        </Link>
                        <button
                          onClick={() => handleDeleteJob(job.id, job.job_title)}
                          className="p-2 border border-red-400 rounded-lg hover:bg-red-50 transition"
                          title="Delete Job"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Row 2: Job Facts and Closing Date - All Inline and Centered */}
                    <div className="flex items-center justify-center text-sm text-gray-700">
                      <span className="font-medium text-gray-700 capitalize">
                        {job.status.replace("_", " ")}
                      </span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="font-medium text-gray-700 capitalize">
                        {job.employment_type.replace("_", " ")}
                      </span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="flex items-center font-medium">
                        <Briefcase className="w-4 h-4 mr-1.5 text-blue-500" />
                        {job.department}
                      </span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{job.location}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span>{job.positions} position{job.positions > 1 ? "s" : ""}</span>
                      <span className="mx-2 text-gray-400">|</span>
                      <span className="font-medium">${job.salary_range_min.toLocaleString()} - ${job.salary_range_max.toLocaleString()}</span>
                      {job.closing_date && (
                        <>
                          <span className="mx-2 text-gray-400">|</span>
                          <span className="font-normal text-gray-600">Closing on <span className="font-medium text-gray-900">{new Date(job.closing_date).toLocaleDateString()}</span></span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
          </div>
        </div>
      </main>
    </div>
  );
}
