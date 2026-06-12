"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Bell, LogOut, Settings, Users } from "lucide-react";
import { useSharedTheme } from "@/lib/hr/shared-theme-hook";

interface Admin {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  work_email?: string;
}

export default function HRAdminHeader() {
  const router = useRouter();
  const { theme, loading } = useSharedTheme();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Load admin data from localStorage or API
    // For now, using a default admin user
    const adminData = {
      id: "admin-1",
      employee_code: "HR-ADMIN-001",
      first_name: "HR",
      last_name: "Administrator",
      job_title: "HR Manager",
      work_email: "hradmin@company.com"
    };
    setAdmin(adminData);
  }, [router]);

  const handleLogout = () => {
    // Clear any auth tokens or session data
    localStorage.clear();
    router.push("/hr");
  };

  // Get logo source (prefer uploaded file over URL)
  const logoSource = theme.logoFile || theme.logoUrl;

  const notifications = [
    { id: 1, title: "New Leave Request", message: "John Doe submitted a leave request for Apr 20-22", time: "1 hour ago", unread: true },
    { id: 2, title: "Pending Approvals", message: "5 leave requests pending your approval", time: "3 hours ago", unread: true },
    { id: 3, title: "New Applicant", message: "New application received for Senior Developer position", time: "5 hours ago", unread: true },
    { id: 4, title: "Payroll Reminder", message: "Payroll processing due in 2 days", time: "1 day ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  if (!admin) return null;

  return (
    <div className="bg-white border-b-2" style={{ borderColor: theme.secondaryColor }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <a href="http://localhost:3004/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {logoSource ? (
              <img src={logoSource} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
              <div
                className="w-10 h-10 flex items-center justify-center"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Users className="w-6 h-6" style={{ color: theme.secondaryColor }} />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: theme.primaryColor }}>
                {theme.appName}
              </span>
              <span className="text-xl text-black">|</span>
              <span className="text-lg font-medium" style={{ color: theme.secondaryColor }}>
                Human Resources
              </span>
            </div>
          </a>

          {/* Admin Info and Actions */}
          <div className="flex items-center space-x-6">
            {/* Admin Name */}
            <div className="text-sm">
              <div className="font-medium text-gray-900">{admin.first_name} {admin.last_name}</div>
              <div className="text-xs text-gray-500">{admin.employee_code}</div>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  ></div>

                  {/* Dropdown */}
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-xs text-gray-600 mt-1">{unreadCount} unread</p>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                            notif.unread ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                              <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-2">{notif.time}</p>
                            </div>
                            {notif.unread && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
