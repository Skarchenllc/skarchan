"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Video,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  Mail,
  Phone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

interface Interview {
  id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  job_title: string;
  job_id: string;
  interview_type: "phone" | "video" | "in_person" | "technical" | "panel";
  interview_stage: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  location?: string;
  meeting_link?: string;
  interviewer_name: string;
  interviewer_email: string;
  panel_members?: string[];
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled" | "no_show";
  notes?: string;
  reminder_sent: boolean;
}

interface TimeSlot {
  date: string;
  time: string;
  available: boolean;
}

export default function InterviewSchedulingPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const [job, setJob] = useState<{id: string; job_title: string} | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentDate, setCurrentDate] = useState(new Date());

  const getInitialForm = () => ({
    candidate_name: "",
    candidate_email: "",
    candidate_phone: "",
    job_title: job?.job_title || "",
    job_id: jobId,
    interview_type: "video" as "phone" | "video" | "in_person" | "technical" | "panel",
    interview_stage: "",
    scheduled_date: "",
    scheduled_time: "",
    duration_minutes: 60,
    location: "",
    meeting_link: "",
    interviewer_name: "",
    interviewer_email: "",
    panel_members: "",
    notes: "",
  });

  const [interviewForm, setInterviewForm] = useState(getInitialForm());

  useEffect(() => {
    loadInterviews();
  }, [jobId]);

  const loadInterviews = async () => {
    try {
      // Load job data
      setJob({ id: jobId, job_title: "Senior Software Engineer" }); // In real app, fetch from API

      // Mock data - in real app, fetch from API filtered by jobId
      const allInterviews: Interview[] = [
        {
          id: "1",
          candidate_name: "Sarah Johnson",
          candidate_email: "sarah.johnson@email.com",
          candidate_phone: "+1 (555) 123-4567",
          job_title: "Senior Software Engineer",
          job_id: "1",
          interview_type: "video",
          interview_stage: "Technical Interview",
          scheduled_date: "2026-04-15",
          scheduled_time: "10:00",
          duration_minutes: 60,
          meeting_link: "https://meet.google.com/abc-defg-hij",
          interviewer_name: "John Doe",
          interviewer_email: "john.doe@company.com",
          status: "scheduled",
          reminder_sent: true,
        },
        {
          id: "2",
          candidate_name: "Michael Chen",
          candidate_email: "michael.chen@email.com",
          candidate_phone: "+1 (555) 234-5678",
          job_title: "Senior Software Engineer",
          job_id: "1",
          interview_type: "panel",
          interview_stage: "Final Interview",
          scheduled_date: "2026-04-16",
          scheduled_time: "14:00",
          duration_minutes: 90,
          location: "Office - Conference Room A",
          interviewer_name: "John Doe",
          interviewer_email: "john.doe@company.com",
          panel_members: ["Jane Smith", "Bob Wilson", "Alice Brown"],
          status: "confirmed",
          reminder_sent: true,
        },
        {
          id: "3",
          candidate_name: "Emily Davis",
          candidate_email: "emily.davis@email.com",
          candidate_phone: "+1 (555) 345-6789",
          job_title: "HR Manager",
          job_id: "2",
          interview_type: "phone",
          interview_stage: "Initial Screening",
          scheduled_date: "2026-04-10",
          scheduled_time: "11:00",
          duration_minutes: 30,
          interviewer_name: "Sarah Anderson",
          interviewer_email: "sarah.anderson@company.com",
          status: "completed",
          reminder_sent: true,
          notes: "Candidate showed strong communication skills. Recommended for next round.",
        },
        {
          id: "4",
          candidate_name: "Robert Taylor",
          candidate_email: "robert.taylor@email.com",
          candidate_phone: "+1 (555) 456-7890",
          job_title: "Marketing Intern",
          job_id: "3",
          interview_type: "video",
          interview_stage: "HR Interview",
          scheduled_date: "2026-04-12",
          scheduled_time: "15:00",
          duration_minutes: 45,
          meeting_link: "https://zoom.us/j/123456789",
          interviewer_name: "Emily Roberts",
          interviewer_email: "emily.roberts@company.com",
          status: "scheduled",
          reminder_sent: false,
        },
      ];
      // Filter interviews for this specific job
      const jobInterviews = allInterviews.filter(i => i.job_id === jobId);
      setInterviews(jobInterviews);
    } catch (err) {
      console.error("Failed to load interviews", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "rescheduled":
        return "bg-yellow-100 text-yellow-800";
      case "no_show":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "phone":
        return <Phone className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "in_person":
        return <MapPin className="w-4 h-4" />;
      case "technical":
        return <Calendar className="w-4 h-4" />;
      case "panel":
        return <Users className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const handleScheduleInterview = () => {
    if (!interviewForm.candidate_name || !interviewForm.interview_stage || !interviewForm.scheduled_date || !interviewForm.scheduled_time) {
      alert("Please fill in all required fields (Candidate Name, Interview Stage, Date, and Time)");
      return;
    }

    const newInterview: Interview = {
      id: Date.now().toString(),
      candidate_name: interviewForm.candidate_name,
      candidate_email: interviewForm.candidate_email,
      candidate_phone: interviewForm.candidate_phone,
      job_title: interviewForm.job_title,
      job_id: interviewForm.job_id,
      interview_type: interviewForm.interview_type,
      interview_stage: interviewForm.interview_stage,
      scheduled_date: interviewForm.scheduled_date,
      scheduled_time: interviewForm.scheduled_time,
      duration_minutes: interviewForm.duration_minutes,
      location: interviewForm.location,
      meeting_link: interviewForm.meeting_link,
      interviewer_name: interviewForm.interviewer_name,
      interviewer_email: interviewForm.interviewer_email,
      panel_members: interviewForm.panel_members ? interviewForm.panel_members.split(',').map(m => m.trim()) : undefined,
      status: "scheduled",
      notes: interviewForm.notes,
      reminder_sent: false,
    };

    setInterviews([newInterview, ...interviews]);
    setShowNewInterviewModal(false);
    resetForm();
  };

  const resetForm = () => {
    setInterviewForm(getInitialForm());
  };

  const handleCancelInterview = (id: string) => {
    if (confirm("Are you sure you want to cancel this interview?")) {
      setInterviews(interviews.map(interview =>
        interview.id === id ? { ...interview, status: "cancelled" as const } : interview
      ));
    }
  };

  const handleCompleteInterview = (id: string) => {
    setInterviews(interviews.map(interview =>
      interview.id === id ? { ...interview, status: "completed" as const } : interview
    ));
  };

  const handleSendReminder = (id: string) => {
    setInterviews(interviews.map(interview =>
      interview.id === id ? { ...interview, reminder_sent: true } : interview
    ));
    alert("Reminder sent successfully!");
  };

  const filteredInterviews = interviews.filter((interview) => {
    const matchesSearch =
      interview.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.interviewer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || interview.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const upcomingInterviews = interviews.filter(
    i => i.status === "scheduled" || i.status === "confirmed"
  ).length;

  const completedInterviews = interviews.filter(i => i.status === "completed").length;
  const cancelledInterviews = interviews.filter(i => i.status === "cancelled").length;

  // Calendar view helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getInterviewsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return interviews.filter(i => i.scheduled_date === dateStr);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading interviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Header */}
      <header className="bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link
                href={`/recruitment/jobs/${jobId}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Interview Scheduling</h1>
                <p className="text-sm text-gray-600">
                  {job ? `Manage interviews for ${job.job_title}` : "Schedule and manage candidate interviews"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowNewInterviewModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Interviews</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{interviews.length}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{upcomingInterviews}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{completedInterviews}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{cancelledInterviews}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* View Toggle */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setViewMode("list")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  viewMode === "list"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                List View
              </button>
              <button
                onClick={() => setViewMode("calendar")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  viewMode === "calendar"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Calendar View
              </button>
            </nav>
          </div>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <div className="space-y-6">
            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by candidate, job, or interviewer..."
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
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="no_show">No Show</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Interviews List */}
            <div className="space-y-4">
              {filteredInterviews.map((interview) => (
                <div key={interview.id} className="bg-white rounded-lg shadow hover:shadow-lg transition">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{interview.candidate_name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(interview.status)}`}>
                            {interview.status.replace("_", " ")}
                          </span>
                          <span className="flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            {getInterviewTypeIcon(interview.interview_type)}
                            <span className="capitalize">{interview.interview_type.replace("_", " ")}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{interview.job_title} - {interview.interview_stage}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(interview.scheduled_date).toLocaleDateString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{interview.scheduled_time} ({interview.duration_minutes} min)</span>
                          </span>
                          {interview.location && (
                            <span className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{interview.location}</span>
                            </span>
                          )}
                          {interview.meeting_link && (
                            <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 text-blue-600 hover:text-blue-700">
                              <Video className="w-4 h-4" />
                              <span>Join Meeting</span>
                            </a>
                          )}
                        </div>
                        {interview.panel_members && interview.panel_members.length > 0 && (
                          <div className="mt-2 flex items-center space-x-2">
                            <Users className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">Panel: {interview.panel_members.join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!interview.reminder_sent && interview.status === "scheduled" && (
                          <button
                            onClick={() => handleSendReminder(interview.id)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            title="Send Reminder"
                          >
                            <Mail className="w-4 h-4 text-gray-600" />
                          </button>
                        )}
                        {interview.status === "scheduled" && (
                          <button
                            onClick={() => handleCompleteInterview(interview.id)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-green-50 transition"
                            title="Mark Complete"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        {interview.status === "scheduled" && (
                          <button
                            onClick={() => handleCancelInterview(interview.id)}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 transition"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-gray-500">Candidate Contact</p>
                        <p className="text-sm text-gray-900">{interview.candidate_email}</p>
                        <p className="text-sm text-gray-900">{interview.candidate_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Interviewer</p>
                        <p className="text-sm text-gray-900">{interview.interviewer_name}</p>
                        <p className="text-sm text-gray-600">{interview.interviewer_email}</p>
                      </div>
                    </div>

                    {interview.notes && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                        <p className="text-sm text-gray-700">{interview.notes}</p>
                      </div>
                    )}

                    {interview.reminder_sent && (
                      <div className="mt-4 flex items-center space-x-2 text-sm text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Reminder sent</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <div className="bg-white rounded-lg shadow p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={previousMonth}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getDaysInMonth(currentDate).map((day, index) => {
                const dayInterviews = day ? getInterviewsForDate(day) : [];

                return (
                  <div
                    key={index}
                    className={`min-h-24 border rounded-lg p-2 ${
                      day ? "bg-white hover:bg-gray-50" : "bg-gray-50"
                    }`}
                  >
                    {day && (
                      <>
                        <div className="text-sm font-medium text-gray-900 mb-1">{day}</div>
                        <div className="space-y-1">
                          {dayInterviews.slice(0, 2).map(interview => (
                            <div
                              key={interview.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer ${getStatusColor(interview.status)}`}
                              title={`${interview.scheduled_time} - ${interview.candidate_name}`}
                            >
                              {interview.scheduled_time} {interview.candidate_name}
                            </div>
                          ))}
                          {dayInterviews.length > 2 && (
                            <div className="text-xs text-gray-600">
                              +{dayInterviews.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Schedule Interview Modal */}
      {showNewInterviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
              <p className="text-sm text-gray-500 mt-1">Schedule a new interview with a candidate</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Candidate Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Candidate Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Candidate Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={interviewForm.candidate_name}
                        onChange={(e) => setInterviewForm({ ...interviewForm, candidate_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={interviewForm.candidate_email}
                        onChange={(e) => setInterviewForm({ ...interviewForm, candidate_email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={interviewForm.candidate_phone}
                        onChange={(e) => setInterviewForm({ ...interviewForm, candidate_phone: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                      <input
                        type="text"
                        value={interviewForm.job_title}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Interview Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Interview Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
                      <select
                        value={interviewForm.interview_type}
                        onChange={(e) => setInterviewForm({ ...interviewForm, interview_type: e.target.value as any })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="phone">Phone Interview</option>
                        <option value="video">Video Interview</option>
                        <option value="in_person">In-Person Interview</option>
                        <option value="technical">Technical Interview</option>
                        <option value="panel">Panel Interview</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Interview Stage <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={interviewForm.interview_stage}
                        onChange={(e) => setInterviewForm({ ...interviewForm, interview_stage: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select interview stage...</option>
                        <option value="Initial Screening">Initial Screening</option>
                        <option value="Phone Screening">Phone Screening</option>
                        <option value="HR Interview">HR Interview</option>
                        <option value="Technical Interview">Technical Interview</option>
                        <option value="Technical Assessment">Technical Assessment</option>
                        <option value="Manager Interview">Manager Interview</option>
                        <option value="Panel Interview">Panel Interview</option>
                        <option value="Final Interview">Final Interview</option>
                        <option value="Culture Fit Interview">Culture Fit Interview</option>
                      </select>
                    </div>                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={interviewForm.scheduled_date}
                        onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_date: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={interviewForm.scheduled_time}
                        onChange={(e) => setInterviewForm({ ...interviewForm, scheduled_time: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                      <input
                        type="number"
                        value={interviewForm.duration_minutes}
                        onChange={(e) => setInterviewForm({ ...interviewForm, duration_minutes: parseInt(e.target.value) || 60 })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location / Meeting Link</label>
                      <input
                        type="text"
                        value={interviewForm.interview_type === "video" ? interviewForm.meeting_link : interviewForm.location}
                        onChange={(e) =>
                          setInterviewForm({
                            ...interviewForm,
                            [interviewForm.interview_type === "video" ? "meeting_link" : "location"]: e.target.value,
                          })
                        }
                        placeholder={interviewForm.interview_type === "video" ? "https://meet.google.com/..." : "Office location"}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Interviewer Details */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Interviewer Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Name</label>
                      <input
                        type="text"
                        value={interviewForm.interviewer_name}
                        onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_name: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Interviewer Email</label>
                      <input
                        type="email"
                        value={interviewForm.interviewer_email}
                        onChange={(e) => setInterviewForm({ ...interviewForm, interviewer_email: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    {interviewForm.interview_type === "panel" && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Panel Members (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={interviewForm.panel_members}
                          onChange={(e) => setInterviewForm({ ...interviewForm, panel_members: e.target.value })}
                          placeholder="John Doe, Jane Smith, Bob Wilson"
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={interviewForm.notes}
                    onChange={(e) => setInterviewForm({ ...interviewForm, notes: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional notes or instructions..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowNewInterviewModal(false);
                  resetForm();
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleScheduleInterview}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Schedule Interview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
