"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Search,
  User,
  Clock,
  Paperclip,
  MoreVertical,
  Users,
  CheckCheck,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_role?: string;
  content: string;
  timestamp: string;
  is_read: boolean;
  is_sent_by_me: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_online: boolean;
}

export default function MessagesPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/employee-portal/login");
      return;
    }

    loadData(employeeId);
  }, [router]);

  const loadData = async (employeeId: string) => {
    try {
      const res = await fetch(`/api/hr/employees`);
      if (res.ok) {
        const employees = await res.json();
        const emp = employees.find((e: any) => e.id === employeeId);
        setEmployee(emp);
      }
    } catch (err) {
      console.error("Failed to load data", err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data - replace with actual API calls
  const conversations: Conversation[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      role: "HR Manager",
      last_message: "Your leave request has been approved!",
      last_message_time: "2026-04-09T10:30:00",
      unread_count: 1,
      is_online: true,
    },
    {
      id: "2",
      name: "Michael Chen",
      role: "Team Lead",
      last_message: "Great work on the project presentation",
      last_message_time: "2026-04-08T16:45:00",
      unread_count: 0,
      is_online: false,
    },
    {
      id: "3",
      name: "HR Department",
      role: "Department",
      last_message: "Reminder: Benefits enrollment ends this month",
      last_message_time: "2026-04-07T09:00:00",
      unread_count: 2,
      is_online: true,
    },
    {
      id: "4",
      name: "Emily Davis",
      role: "Colleague",
      last_message: "Thanks for your help with the report!",
      last_message_time: "2026-04-06T14:20:00",
      unread_count: 0,
      is_online: false,
    },
  ];

  const messages: Record<string, Message[]> = {
    "1": [
      {
        id: 1,
        sender_id: "1",
        sender_name: "Sarah Johnson",
        sender_role: "HR Manager",
        content: "Hi! I received your leave request for April 15-17.",
        timestamp: "2026-04-09T10:15:00",
        is_read: true,
        is_sent_by_me: false,
      },
      {
        id: 2,
        sender_id: "me",
        sender_name: "Me",
        content: "Thank you! I hope it can be approved.",
        timestamp: "2026-04-09T10:20:00",
        is_read: true,
        is_sent_by_me: true,
      },
      {
        id: 3,
        sender_id: "1",
        sender_name: "Sarah Johnson",
        sender_role: "HR Manager",
        content: "Your leave request has been approved! Enjoy your time off.",
        timestamp: "2026-04-09T10:30:00",
        is_read: false,
        is_sent_by_me: false,
      },
    ],
    "2": [
      {
        id: 1,
        sender_id: "2",
        sender_name: "Michael Chen",
        sender_role: "Team Lead",
        content: "Great work on the project presentation yesterday!",
        timestamp: "2026-04-08T16:45:00",
        is_read: true,
        is_sent_by_me: false,
      },
      {
        id: 2,
        sender_id: "me",
        sender_name: "Me",
        content: "Thank you so much! I appreciate the feedback.",
        timestamp: "2026-04-08T16:50:00",
        is_read: true,
        is_sent_by_me: true,
      },
    ],
    "3": [
      {
        id: 1,
        sender_id: "3",
        sender_name: "HR Department",
        content: "Annual benefits enrollment is now open!",
        timestamp: "2026-04-07T09:00:00",
        is_read: true,
        is_sent_by_me: false,
      },
      {
        id: 2,
        sender_id: "3",
        sender_name: "HR Department",
        content: "Reminder: Benefits enrollment ends this month. Please review your options.",
        timestamp: "2026-04-07T09:00:00",
        is_read: false,
        is_sent_by_me: false,
      },
    ],
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);

    // Simulate sending message
    setTimeout(() => {
      setNewMessage("");
      setSending(false);
    }, 500);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = conversations.find((c) => c.id === selectedConversation);
  const currentMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            <span className="text-gray-400">|</span>
            <p className="text-sm text-gray-600">Communicate with colleagues and HR</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r flex flex-col">
              {/* Search */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className={`p-4 border-b cursor-pointer transition ${
                        selectedConversation === conv.id
                          ? "bg-blue-50 border-l-4 border-l-blue-600"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {conv.name.charAt(0)}
                            </span>
                          </div>
                          {conv.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">
                              {conv.name}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatTime(conv.last_message_time)}
                            </span>
                          </div>
                          {conv.role && (
                            <p className="text-xs text-gray-500 mb-1">{conv.role}</p>
                          )}
                          <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                        </div>
                        {conv.unread_count > 0 && (
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full">
                              {conv.unread_count}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {selectedConv?.name.charAt(0)}
                          </span>
                        </div>
                        {selectedConv?.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{selectedConv?.name}</h3>
                        <p className="text-xs text-gray-500">
                          {selectedConv?.is_online ? "Online" : "Offline"}
                        </p>
                      </div>
                    </div>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {currentMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.is_sent_by_me ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-md ${
                            message.is_sent_by_me
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          } rounded-lg px-4 py-2`}
                        >
                          {!message.is_sent_by_me && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {message.sender_name}
                              {message.sender_role && ` • ${message.sender_role}`}
                            </p>
                          )}
                          <p className="text-sm">{message.content}</p>
                          <div className="flex items-center justify-end space-x-1 mt-1">
                            <p className="text-xs opacity-75">
                              {formatTime(message.timestamp)}
                            </p>
                            {message.is_sent_by_me && (
                              <CheckCheck
                                className={`w-3 h-3 ${
                                  message.is_read ? "text-blue-200" : "text-white opacity-50"
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <div className="flex items-end space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition">
                        <Paperclip className="w-5 h-5" />
                      </button>
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          placeholder="Type a message..."
                          rows={1}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                      </div>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Press Enter to send, Shift + Enter for new line
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-sm text-gray-500">
                      Choose a conversation from the list to start messaging
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
