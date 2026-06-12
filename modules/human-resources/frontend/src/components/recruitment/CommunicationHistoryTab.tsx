"use client";

import { Mail, MessageSquare, Phone, Video, Send, Calendar, User, Eye, Plus, Filter, Search } from "lucide-react";
import { useState } from "react";

interface Communication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_email: string;
  communication_type: "email" | "message" | "phone" | "video_call" | "in_person";
  direction: "outbound" | "inbound";
  subject?: string;
  message: string;
  sent_by?: string;
  sent_to?: string;
  sent_date: string;
  status: "sent" | "delivered" | "read" | "replied" | "failed";
  attachments?: string[];
  related_stage?: string;
  tags?: string[];
  notes?: string;
}

interface CommunicationHistoryTabProps {
  communications: Communication[];
  onSendMessage?: (applicantId: string) => void;
  onViewMessage?: (communicationId: string) => void;
}

export function CommunicationHistoryTab({ communications, onSendMessage, onViewMessage }: CommunicationHistoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="w-5 h-5 text-blue-600" />;
      case "message": return <MessageSquare className="w-5 h-5 text-green-600" />;
      case "phone": return <Phone className="w-5 h-5 text-purple-600" />;
      case "video_call": return <Video className="w-5 h-5 text-red-600" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "read": return "bg-blue-100 text-blue-800";
      case "replied": return "bg-green-100 text-green-800";
      case "delivered": return "bg-purple-100 text-purple-800";
      case "sent": return "bg-gray-100 text-gray-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === "outbound" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200";
  };

  const getDirectionLabel = (direction: string) => {
    return direction === "outbound" ? "Sent to candidate" : "Received from candidate";
  };

  // Filter communications
  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = searchTerm === "" ||
      comm.applicant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comm.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || comm.communication_type === filterType;

    return matchesSearch && matchesType;
  });

  // Group communications by applicant
  const groupedCommunications = filteredCommunications.reduce((acc, comm) => {
    if (!acc[comm.applicant_name]) {
      acc[comm.applicant_name] = {
        applicant_id: comm.applicant_id,
        applicant_email: comm.applicant_email,
        communications: []
      };
    }
    acc[comm.applicant_name].communications.push(comm);
    return acc;
  }, {} as Record<string, { applicant_id: string; applicant_email: string; communications: Communication[] }>);

  // Sort communications by date (newest first)
  Object.values(groupedCommunications).forEach(group => {
    group.communications.sort((a, b) => new Date(b.sent_date).getTime() - new Date(a.sent_date).getTime());
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Communication History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Track all email, message, and call communications with candidates
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Send className="w-4 h-4" />
          <span>Send Message</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search communications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
            >
              <option value="all">All Types</option>
              <option value="email">Email</option>
              <option value="message">Message</option>
              <option value="phone">Phone Call</option>
              <option value="video_call">Video Call</option>
              <option value="in_person">In-Person</option>
            </select>
          </div>
        </div>
      </div>

      {filteredCommunications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterType !== "all" ? "No Communications Found" : "No Communications Yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || filterType !== "all"
              ? "Try adjusting your search or filter criteria"
              : "All candidate communications will appear here"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedCommunications).map(([applicantName, data]) => (
            <div key={applicantName} className="bg-white rounded-lg shadow">
              {/* Applicant Header */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{applicantName}</h3>
                      <p className="text-sm text-gray-600">{data.applicant_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">
                      {data.communications.length} message{data.communications.length > 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => onSendMessage?.(data.applicant_id)}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center space-x-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Communications Timeline */}
              <div className="p-4 space-y-3">
                {data.communications.map((comm, index) => (
                  <div
                    key={comm.id}
                    className={`border rounded-lg p-4 ${getDirectionColor(comm.direction)} ${
                      expandedId === comm.id ? "ring-2 ring-blue-500" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(comm.communication_type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900 capitalize">
                              {comm.communication_type.replace("_", " ")}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">
                              {getDirectionLabel(comm.direction)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {new Date(comm.sent_date).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(comm.status)}`}>
                          {comm.status}
                        </span>
                        {comm.related_stage && (
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                            {comm.related_stage}
                          </span>
                        )}
                      </div>
                    </div>

                    {comm.subject && (
                      <h4 className="font-medium text-gray-900 mb-2">{comm.subject}</h4>
                    )}

                    <div className="text-sm text-gray-700">
                      {expandedId === comm.id ? (
                        <div className="space-y-3">
                          <p className="whitespace-pre-wrap">{comm.message}</p>

                          {comm.attachments && comm.attachments.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-gray-600 mb-2">Attachments:</p>
                              <div className="flex flex-wrap gap-2">
                                {comm.attachments.map((attachment, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {attachment}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {comm.tags && comm.tags.length > 0 && (
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-gray-600 mb-2">Tags:</p>
                              <div className="flex flex-wrap gap-2">
                                {comm.tags.map((tag, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {comm.sent_by && (
                            <div className="pt-3 border-t text-xs text-gray-600">
                              <span className="font-medium">Sent by:</span> {comm.sent_by}
                            </div>
                          )}

                          {comm.notes && (
                            <div className="pt-3 border-t">
                              <p className="text-xs font-medium text-gray-600 mb-1">Internal Notes:</p>
                              <p className="text-xs text-gray-700">{comm.notes}</p>
                            </div>
                          )}

                          <button
                            onClick={() => setExpandedId(null)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Show less
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="line-clamp-2">{comm.message}</p>
                          <button
                            onClick={() => setExpandedId(comm.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                          >
                            Show more
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {communications.length > 0 && (
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{communications.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Emails</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {communications.filter(c => c.communication_type === "email").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Sent</p>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {communications.filter(c => c.direction === "outbound").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Received</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {communications.filter(c => c.direction === "inbound").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Replied</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {communications.filter(c => c.status === "replied").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
