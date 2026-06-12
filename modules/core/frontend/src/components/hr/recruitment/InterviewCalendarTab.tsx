"use client";

import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, Video, Users, Plus, Filter } from "lucide-react";
import { useState } from "react";

interface InterviewEvent {
  id: string;
  job_id: string;
  job_title: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  interview_stage: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  interviewer_name: string;
  interviewer_email: string;
  location_type: "in_person" | "video_call" | "phone";
  location?: string;
  meeting_link?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled" | "rescheduled";
  notes?: string;
  panel_members?: string[];
}

interface InterviewCalendarTabProps {
  interviews: InterviewEvent[];
  onScheduleInterview?: () => void;
  onViewInterview?: (interviewId: string) => void;
}

export function InterviewCalendarTab({ interviews, onScheduleInterview, onViewInterview }: InterviewCalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day" | "list">("month");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Calendar helpers
  const getMonthName = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduled_date);
      return (
        interviewDate.getDate() === date.getDate() &&
        interviewDate.getMonth() === date.getMonth() &&
        interviewDate.getFullYear() === date.getFullYear() &&
        (filterStatus === "all" || interview.status === filterStatus)
      );
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled": return "bg-blue-500";
      case "confirmed": return "bg-green-500";
      case "completed": return "bg-gray-500";
      case "cancelled": return "bg-red-500";
      case "rescheduled": return "bg-yellow-500";
      default: return "bg-gray-500";
    }
  };

  const getLocationIcon = (locationType: string) => {
    switch (locationType) {
      case "video_call": return <Video className="w-4 h-4" />;
      case "phone": return <Clock className="w-4 h-4" />;
      case "in_person": return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const renderMonthView = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Day headers
    const headers = dayNames.map(day => (
      <div key={day} className="text-center text-sm font-semibold text-gray-700 p-2 bg-gray-50">
        {day}
      </div>
    ));

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 border border-gray-200 p-2 min-h-[120px]" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayInterviews = getInterviewsForDate(date);
      const today = isToday(date);

      days.push(
        <div
          key={day}
          className={`border border-gray-200 p-2 min-h-[120px] hover:bg-gray-50 transition ${
            today ? "bg-blue-50 border-blue-300" : "bg-white"
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${today ? "text-blue-600" : "text-gray-900"}`}>
            {day}
            {today && <span className="ml-1 text-xs">(Today)</span>}
          </div>
          <div className="space-y-1">
            {dayInterviews.slice(0, 3).map(interview => (
              <div
                key={interview.id}
                onClick={() => onViewInterview?.(interview.id)}
                className="text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition flex items-center space-x-1 bg-blue-100 text-blue-800"
              >
                <div className={`w-2 h-2 rounded-full ${getStatusColor(interview.status)}`} />
                <span className="truncate flex-1">
                  {interview.scheduled_time} - {interview.applicant_name}
                </span>
              </div>
            ))}
            {dayInterviews.length > 3 && (
              <div className="text-xs text-gray-500 pl-1">
                +{dayInterviews.length - 3} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="grid grid-cols-7">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    // Group interviews by date
    const filteredInterviews = filterStatus === "all"
      ? interviews
      : interviews.filter(i => i.status === filterStatus);

    const groupedByDate = filteredInterviews.reduce((acc, interview) => {
      const dateKey = new Date(interview.scheduled_date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(interview);
      return acc;
    }, {} as Record<string, InterviewEvent[]>);

    // Sort dates
    const sortedDates = Object.keys(groupedByDate).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    return (
      <div className="space-y-6">
        {sortedDates.map(dateKey => {
          const date = new Date(dateKey);
          const dayInterviews = groupedByDate[dateKey];

          return (
            <div key={dateKey} className="bg-white rounded-lg shadow">
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </h3>
                  </div>
                  {isToday(date) && (
                    <span className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full">
                      Today
                    </span>
                  )}
                </div>
              </div>

              <div className="divide-y">
                {dayInterviews
                  .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
                  .map(interview => (
                    <div
                      key={interview.id}
                      className="p-4 hover:bg-gray-50 transition cursor-pointer"
                      onClick={() => onViewInterview?.(interview.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-semibold text-gray-900">{interview.scheduled_time}</span>
                                <span className="text-sm text-gray-500">
                                  ({interview.duration_minutes} min)
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">{interview.interview_stage}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 ml-8 text-sm">
                            <div>
                              <p className="text-gray-600">Candidate</p>
                              <p className="font-medium text-gray-900">{interview.applicant_name}</p>
                              <p className="text-xs text-gray-500">{interview.applicant_email}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Interviewer</p>
                              <p className="font-medium text-gray-900">{interview.interviewer_name}</p>
                              {interview.panel_members && interview.panel_members.length > 0 && (
                                <p className="text-xs text-gray-500 flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span>+{interview.panel_members.length} panel members</span>
                                </p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-600">Location</p>
                              <div className="flex items-center space-x-1">
                                {getLocationIcon(interview.location_type)}
                                <p className="font-medium text-gray-900 capitalize">
                                  {interview.location_type.replace("_", " ")}
                                </p>
                              </div>
                              {interview.location && (
                                <p className="text-xs text-gray-500">{interview.location}</p>
                              )}
                            </div>
                          </div>

                          {interview.job_title && (
                            <div className="ml-8 mt-2">
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                {interview.job_title}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="ml-4">
                          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            interview.status === "scheduled" ? "bg-blue-100 text-blue-800" :
                            interview.status === "confirmed" ? "bg-green-100 text-green-800" :
                            interview.status === "completed" ? "bg-gray-100 text-gray-800" :
                            interview.status === "cancelled" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {interview.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}

        {sortedDates.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Interviews Found</h3>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Interview Calendar</h2>
        </div>
        <button
          onClick={onScheduleInterview}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Interview</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Today
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth("prev")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h3 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
                {getMonthName(currentDate)}
              </h3>
              <button
                onClick={() => navigateMonth("next")}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-sm rounded transition ${
                  viewMode === "month" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm rounded transition ${
                  viewMode === "list" ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                List
              </button>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="rescheduled">Rescheduled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "month" ? renderMonthView() : renderListView()}

      {/* Summary Cards */}
      {interviews.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Interviews</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{interviews.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {interviews.filter(i => i.status === "scheduled").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Confirmed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {interviews.filter(i => i.status === "confirmed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-600 mt-1">
              {interviews.filter(i => i.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">This Week</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {interviews.filter(i => {
                const interviewDate = new Date(i.scheduled_date);
                const today = new Date();
                const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                return interviewDate >= today && interviewDate <= weekFromNow;
              }).length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
