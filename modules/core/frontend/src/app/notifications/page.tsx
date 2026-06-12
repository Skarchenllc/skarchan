'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { useNotifications } from '@/contexts/NotificationContext';
import { Notification, NotificationCategory, NotificationPriority } from '@/types';
import { FiBell, FiCheck, FiTrash2, FiFilter } from 'react-icons/fi';
import { Bell } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');

  const notificationsArray = Array.isArray(notifications) ? notifications : [];

  const filteredNotifications = notificationsArray.filter((notification) => {
    if (filterCategory !== 'all' && notification.category !== filterCategory) return false;
    if (filterPriority !== 'all' && notification.priority !== filterPriority) return false;
    if (filterRead === 'read' && !notification.is_read) return false;
    if (filterRead === 'unread' && notification.is_read) return false;
    return true;
  });

  const getPriorityColor = (priority: NotificationPriority) => {
    switch (priority) {
      case NotificationPriority.URGENT:
        return 'bg-red-100 text-red-700 border-red-300';
      case NotificationPriority.HIGH:
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case NotificationPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case NotificationPriority.LOW:
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case NotificationCategory.SYSTEM:
        return 'bg-blue-100 text-blue-700';
      case NotificationCategory.SECURITY:
        return 'bg-red-100 text-red-700';
      case NotificationCategory.USER:
        return 'bg-green-100 text-green-700';
      case NotificationCategory.INFO:
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <main className="mt-16 p-8 max-w-7xl mx-auto">
          <div className="mb-12">
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>

          {/* Compact Statistics Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                
                <span className="text-sm text-gray-600">Total Notifications</span>
                <span className="text-xl font-bold text-gray-900">{notifications.length}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                
                <span className="text-sm text-gray-600">Unread</span>
                <span className="text-xl font-bold text-gray-900">{unreadCount}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                
                <span className="text-sm text-gray-600">Read</span>
                <span className="text-xl font-bold text-gray-900">{notifications.length - unreadCount}</span>
              </div>
            </div>
          </div>

            <Card>
              <div className="mb-6">
                <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">Filters:</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={markAllAsRead}>
                    <FiCheck className="w-4 h-4 mr-2" />
                    Mark All as Read
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Categories</option>
                      <option value={NotificationCategory.SYSTEM}>System</option>
                      <option value={NotificationCategory.USER}>User</option>
                      <option value={NotificationCategory.SECURITY}>Security</option>
                      <option value={NotificationCategory.INFO}>Info</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Priorities</option>
                      <option value={NotificationPriority.URGENT}>Urgent</option>
                      <option value={NotificationPriority.HIGH}>High</option>
                      <option value={NotificationPriority.MEDIUM}>Medium</option>
                      <option value={NotificationPriority.LOW}>Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filterRead}
                      onChange={(e) => setFilterRead(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All</option>
                      <option value="unread">Unread</option>
                      <option value="read">Read</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-gray-500">Loading notifications...</div>
                ) : filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">No notifications found</div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        p-4 rounded-lg border-l-4 transition-colors
                        ${
                          notification.is_read
                            ? 'bg-white border-gray-300'
                            : 'bg-blue-50 border-blue-500'
                        }
                        ${getPriorityColor(notification.priority)}
                      `}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {notification.title}
                            </h3>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(
                                notification.category
                              )}`}
                            >
                              {notification.category}
                            </span>
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(
                                notification.priority
                              )}`}
                            >
                              {notification.priority}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-2">{notification.message}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(notification.created_at), 'MMM dd, yyyy HH:mm')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-green-600 hover:text-green-800 p-2"
                              title="Mark as read"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Delete"
                          >
                            <FiTrash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
