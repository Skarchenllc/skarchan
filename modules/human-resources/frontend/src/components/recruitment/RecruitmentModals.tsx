"use client";

import { useState } from "react";
import { X, Calendar, Clock, User, DollarSign, FileText, UserPlus, Users as UsersIcon } from "lucide-react";

interface ScheduleInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantName: string;
  applicantId: string;
  jobTitle: string;
  interviewStages: string[];
  interviewPanel: Array<{ id: string; name: string; email: string; interview_stage: string }>;
  onSchedule: (data: {
    applicantId: string;
    applicantName: string;
    interviewStage: string;
    scheduledDate: string;
    scheduledTime: string;
    interviewer: string;
  }) => void;
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  applicantName,
  applicantId,
  jobTitle,
  interviewStages,
  interviewPanel,
  onSchedule,
}: ScheduleInterviewModalProps) {
  const [formData, setFormData] = useState({
    interviewStage: interviewStages[0] || "",
    scheduledDate: "",
    scheduledTime: "",
    interviewer: "",
    location: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule({
      applicantId,
      applicantName,
      interviewStage: formData.interviewStage,
      scheduledDate: formData.scheduledDate,
      scheduledTime: formData.scheduledTime,
      interviewer: formData.interviewer,
    });
    onClose();
    // Reset form
    setFormData({
      interviewStage: interviewStages[0] || "",
      scheduledDate: "",
      scheduledTime: "",
      interviewer: "",
      location: "",
      notes: "",
    });
  };

  const availableInterviewers = interviewPanel.filter(
    (member) => member.interview_stage === formData.interviewStage
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Schedule Interview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {applicantName} - {jobTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interview Stage <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.interviewStage}
                onChange={(e) => setFormData({ ...formData, interviewStage: e.target.value, interviewer: "" })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                {interviewStages.map((stage, index) => (
                  <option key={index} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interviewer <span className="text-red-500">*</span>
              </label>
              {availableInterviewers.length > 0 ? (
                <select
                  value={formData.interviewer}
                  onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select interviewer...</option>
                  {availableInterviewers.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} - {member.email}
                    </option>
                  ))}
                </select>
              ) : (
                <div>
                  <input
                    type="text"
                    value={formData.interviewer}
                    onChange={(e) => setFormData({ ...formData, interviewer: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter interviewer name"
                    required
                  />
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ No panel members assigned. Enter interviewer name manually.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location / Meeting Link</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Conference Room A or https://meet.google.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes or instructions..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Schedule Interview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicantName: string;
  applicantId: string;
  jobTitle: string;
  salaryRange: { min: number; max: number };
  onCreateOffer: (data: {
    applicantId: string;
    applicantName: string;
    salaryOffered: number;
    startDate: string;
    expiryDate: string;
  }) => void;
}

export function CreateOfferModal({
  isOpen,
  onClose,
  applicantName,
  applicantId,
  jobTitle,
  salaryRange,
  onCreateOffer,
}: CreateOfferModalProps) {
  const [formData, setFormData] = useState({
    salaryOffered: Math.round((salaryRange.min + salaryRange.max) / 2),
    startDate: "",
    expiryDate: "",
    benefits: "",
    notes: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOffer({
      applicantId,
      applicantName,
      salaryOffered: formData.salaryOffered,
      startDate: formData.startDate,
      expiryDate: formData.expiryDate,
    });
    onClose();
    // Reset form
    setFormData({
      salaryOffered: Math.round((salaryRange.min + salaryRange.max) / 2),
      startDate: "",
      expiryDate: "",
      benefits: "",
      notes: "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create Job Offer</h2>
            <p className="text-sm text-gray-600 mt-1">
              {applicantName} - {jobTitle}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Salary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">$</span>
                </div>
                <input
                  type="number"
                  value={formData.salaryOffered}
                  onChange={(e) => setFormData({ ...formData, salaryOffered: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min={salaryRange.min}
                  max={salaryRange.max}
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Salary range: ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Benefits</label>
              <textarea
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="List any additional benefits or perks..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Create Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AssignRecruiterModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  jobId: string;
  currentRecruiters?: Array<{ id: string; name: string; email: string; role: string }>;
  availableRecruiters: Array<{ id: string; name: string; email: string; department: string; active_jobs: number }>;
  onAssignRecruiter: (data: {
    jobId: string;
    recruiterId: string;
    recruiterName: string;
    role: string;
  }) => void;
}

export function AssignRecruiterModal({
  isOpen,
  onClose,
  jobTitle,
  jobId,
  currentRecruiters = [],
  availableRecruiters,
  onAssignRecruiter,
}: AssignRecruiterModalProps) {
  const [formData, setFormData] = useState({
    recruiterId: "",
    role: "primary",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedRecruiter = availableRecruiters.find(r => r.id === formData.recruiterId);
    if (selectedRecruiter) {
      onAssignRecruiter({
        jobId,
        recruiterId: formData.recruiterId,
        recruiterName: selectedRecruiter.name,
        role: formData.role,
      });
      onClose();
      // Reset form
      setFormData({
        recruiterId: "",
        role: "primary",
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Assign Recruiter</h2>
            <p className="text-sm text-gray-600 mt-1">{jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Current Recruiters */}
          {currentRecruiters.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Currently Assigned:</h3>
              <div className="space-y-2">
                {currentRecruiters.map(recruiter => (
                  <div key={recruiter.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-900">{recruiter.name}</span>
                      <span className="text-blue-700">({recruiter.email})</span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {recruiter.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Recruiter <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.recruiterId}
                onChange={(e) => setFormData({ ...formData, recruiterId: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a recruiter...</option>
                {availableRecruiters.map((recruiter) => (
                  <option key={recruiter.id} value={recruiter.id}>
                    {recruiter.name} ({recruiter.email}) - {recruiter.department} - {recruiter.active_jobs} active jobs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="primary">Primary Recruiter</option>
                <option value="secondary">Secondary Recruiter</option>
                <option value="coordinator">Coordinator</option>
                <option value="sourcer">Sourcer</option>
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Primary recruiters have full management access to the requisition
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Assign Recruiter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
