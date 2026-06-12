"use client";

import { UserCheck, Phone, Mail, CheckCircle, Clock, AlertCircle, Plus, Star, MessageSquare } from "lucide-react";
import { useState } from "react";

interface Reference {
  id: string;
  applicant_id: string;
  applicant_name: string;
  reference_name: string;
  reference_title: string;
  reference_company: string;
  reference_email: string;
  reference_phone: string;
  relationship: string;
  status: "pending" | "contacted" | "completed" | "unreachable";
  contacted_date?: string;
  completed_date?: string;
  rating?: number;
  feedback?: string;
  would_rehire?: "yes" | "no" | "unsure";
  notes?: string;
}

interface ReferenceCheckTabProps {
  references: Reference[];
  onAddReference?: (applicantId: string) => void;
  onContactReference?: (referenceId: string) => void;
}

export function ReferenceCheckTab({ references, onAddReference, onContactReference }: ReferenceCheckTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "contacted": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "unreachable": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "contacted": return <Phone className="w-5 h-5 text-blue-600" />;
      case "pending": return <Clock className="w-5 h-5 text-yellow-600" />;
      case "unreachable": return <AlertCircle className="w-5 h-5 text-red-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const groupedReferences = references.reduce((acc, ref) => {
    if (!acc[ref.applicant_name]) {
      acc[ref.applicant_name] = [];
    }
    acc[ref.applicant_name].push(ref);
    return acc;
  }, {} as Record<string, Reference[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Reference Checks</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track and manage reference verifications for shortlisted candidates
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          <span>Add Reference</span>
        </button>
      </div>

      {references.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No References Yet</h3>
          <p className="text-gray-600 mb-4">
            Start collecting references from shortlisted candidates
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedReferences).map(([applicantName, refs]) => (
            <div key={applicantName} className="bg-white rounded-lg shadow">
              {/* Applicant Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{applicantName}</h3>
                    <p className="text-sm text-gray-600">{refs.length} reference{refs.length > 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {refs.filter(r => r.status === "completed").length} / {refs.length} completed
                    </span>
                  </div>
                </div>
              </div>

              {/* References List */}
              <div className="divide-y">
                {refs.map((reference) => (
                  <div key={reference.id} className="p-6 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusIcon(reference.status)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{reference.reference_name}</h4>
                            <p className="text-sm text-gray-600">
                              {reference.reference_title} at {reference.reference_company}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(reference.status)}`}>
                            {reference.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-gray-600">Relationship</p>
                            <p className="font-medium text-gray-900">{reference.relationship}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{reference.reference_email}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">{reference.reference_phone}</p>
                          </div>
                        </div>

                        {reference.status === "contacted" && reference.contacted_date && (
                          <div className="text-sm text-gray-600 mb-2">
                            Contacted on {new Date(reference.contacted_date).toLocaleDateString()}
                          </div>
                        )}

                        {reference.status === "completed" && (
                          <div className="mt-3 space-y-3">
                            <div className="flex items-center space-x-4">
                              {reference.rating && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Rating:</span>
                                  <div className="flex items-center space-x-1">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-4 h-4 ${i < reference.rating! ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {reference.would_rehire && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm text-gray-600">Would Rehire:</span>
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    reference.would_rehire === "yes" ? "bg-green-100 text-green-800" :
                                    reference.would_rehire === "no" ? "bg-red-100 text-red-800" :
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {reference.would_rehire}
                                  </span>
                                </div>
                              )}
                            </div>

                            {reference.feedback && (
                              <div className="p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-start space-x-2">
                                  <MessageSquare className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Feedback:</p>
                                    <p className="text-sm text-blue-800">{reference.feedback}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {reference.notes && (
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-1">Internal Notes:</p>
                                <p className="text-sm text-gray-900">{reference.notes}</p>
                              </div>
                            )}

                            <div className="text-xs text-gray-500">
                              Completed on {new Date(reference.completed_date!).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {reference.status === "pending" && (
                          <button
                            onClick={() => onContactReference?.(reference.id)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm flex items-center space-x-1"
                          >
                            <Phone className="w-4 h-4" />
                            <span>Contact</span>
                          </button>
                        )}
                        {reference.status === "contacted" && (
                          <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Complete Check</span>
                          </button>
                        )}
                        {reference.status === "completed" && (
                          <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm">
                            View Full Report
                          </button>
                        )}
                        {reference.status === "unreachable" && (
                          <button className="px-3 py-2 border border-yellow-300 text-yellow-700 rounded-lg hover:bg-yellow-50 transition text-sm">
                            Retry Contact
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
      {references.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total References</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{references.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">
              {references.filter(r => r.status === "pending").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {references.filter(r => r.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Positive</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {references.filter(r => r.would_rehire === "yes").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
