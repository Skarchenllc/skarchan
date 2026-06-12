"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Navigation from "@/components/Navigation";

interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  attendance_date: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  regular_hours?: number;
  overtime_hours?: number;
  break_hours?: number;
  notes?: string;
  location?: string;
  is_approved?: boolean;
}

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadEmployees();
    loadAttendance();
  }, [selectedDate]);

  const loadEmployees = async () => {
    try {
      const res = await fetch("/api/hr/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (err) {
      console.error("Failed to load employees", err);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await fetch(`/api/hr/attendance?start_date=${selectedDate}&end_date=${selectedDate}`);
      if (res.ok) {
        const data = await res.json();
        setAttendanceRecords(data);
      }
    } catch (err) {
      console.error("Failed to load attendance", err);
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-100 text-green-800";
      case "absent": return "bg-red-100 text-red-800";
      case "late": return "bg-yellow-100 text-yellow-800";
      case "half_day": return "bg-blue-100 text-blue-800";
      case "on_leave": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "absent": return <XCircle className="w-5 h-5 text-red-600" />;
      case "late": return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case "half_day": return <Clock className="w-5 h-5 text-blue-600" />;
      default: return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTime = (dateString: string | undefined | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return "-";
    }
  };

  const calculateHoursFromTimes = (clockIn: string | undefined | null, clockOut: string | undefined | null) => {
    if (!clockIn) return 0;

    try {
      const start = new Date(clockIn);
      const end = clockOut ? new Date(clockOut) : new Date(); // Use current time if not clocked out
      const diffMs = end.getTime() - start.getTime();
      const hours = diffMs / (1000 * 60 * 60); // Convert milliseconds to hours
      return Math.max(0, hours); // Ensure non-negative
    } catch {
      return 0;
    }
  };

  const calculateTotalHours = (record: AttendanceRecord) => {
    // If database has hours, use those
    if (record.regular_hours || record.overtime_hours) {
      return (record.regular_hours || 0) + (record.overtime_hours || 0);
    }

    // Otherwise calculate from clock times
    return calculateHoursFromTimes(record.clock_in, record.clock_out);
  };

  const getRegularHours = (record: AttendanceRecord) => {
    if (record.regular_hours) return record.regular_hours;

    // Calculate from times, capped at 8 hours for regular
    const totalHours = calculateHoursFromTimes(record.clock_in, record.clock_out);
    return Math.min(totalHours, 8);
  };

  const getOvertimeHours = (record: AttendanceRecord) => {
    if (record.overtime_hours) return record.overtime_hours;

    // Calculate overtime (anything over 8 hours)
    const totalHours = calculateHoursFromTimes(record.clock_in, record.clock_out);
    return Math.max(0, totalHours - 8);
  };

  const stats = {
    present: attendanceRecords.filter(r => r.status === "present").length,
    absent: attendanceRecords.filter(r => r.status === "absent").length,
    late: attendanceRecords.filter(r => r.status === "late").length,
    halfDay: attendanceRecords.filter(r => r.status === "half_day").length,
    total: attendanceRecords.length,
    totalHours: attendanceRecords.reduce((sum, r) => sum + calculateTotalHours(r), 0),
    totalOvertimeHours: attendanceRecords.reduce((sum, r) => sum + (r.overtime_hours || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow mb-6">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
          </div>

          {/* Date Selector */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <Calendar className="w-5 h-5 text-gray-400" />
              <label className="text-sm font-medium text-gray-700">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Stats - with light background */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-gray-500" />
                <div>
                  <div className="text-xs text-gray-500">Total Employees</div>
                  <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-xs text-gray-500">Present</div>
                  <div className="text-lg font-bold text-green-600">{stats.present}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <div>
                  <div className="text-xs text-gray-500">Absent</div>
                  <div className="text-lg font-bold text-red-600">{stats.absent}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-xs text-gray-500">Late/Half Day</div>
                  <div className="text-lg font-bold text-yellow-600">{stats.late + stats.halfDay}</div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 text-sm text-gray-700">
              <span className="font-medium">Total Hours Worked:</span> {stats.totalHours.toFixed(2)}h
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Overtime Hours:</span> <span className="text-orange-600 font-semibold">{stats.totalOvertimeHours.toFixed(2)}h</span>
              <span className="text-gray-400 mx-2">|</span>
              <span className="font-medium">Date:</span> {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          {/* Attendance Records */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading attendance records...</p>
              </div>
            ) : attendanceRecords.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No attendance records found</p>
                <p className="text-sm text-gray-400">No records for the selected date</p>
              </div>
            ) : (
              <div className="overflow-x-auto p-6">
                <table className="w-full border-collapse">
                  <thead className="bg-blue-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Clock In
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Clock Out
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Regular Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Overtime
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Total Hours
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Location
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border border-gray-300 bg-blue-100">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {attendanceRecords.map((record) => {
                      const totalHours = calculateTotalHours(record);
                      const regularHours = getRegularHours(record);
                      const overtimeHours = getOvertimeHours(record);
                      const isCurrentlyWorking = record.clock_in && !record.clock_out;

                      return (
                        <tr key={record.id} className="hover:bg-blue-50 transition">
                          <td className="px-4 py-3 border border-gray-300">
                            <div className="flex items-center">
                              {getStatusIcon(record.status)}
                              <span className="ml-2 text-sm font-medium text-gray-900">
                                {getEmployeeName(record.employee_id)}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center border border-gray-300">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(record.status)}`}>
                              {record.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300">
                            {formatTime(record.clock_in)}
                          </td>
                          <td className="px-4 py-3 text-sm border border-gray-300">
                            {record.clock_out ? (
                              <span className="text-gray-900">{formatTime(record.clock_out)}</span>
                            ) : record.clock_in ? (
                              <span className="text-green-600 font-medium animate-pulse">Working...</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 border border-gray-300">
                            {regularHours > 0 ? (
                              <>
                                {regularHours.toFixed(2)}h
                                {isCurrentlyWorking && <span className="ml-1 text-xs text-gray-500">(live)</span>}
                              </>
                            ) : (
                              <span className="text-gray-400">0.00h</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm border border-gray-300">
                            {overtimeHours > 0 ? (
                              <span className="text-orange-600 font-semibold">
                                {overtimeHours.toFixed(2)}h
                                {isCurrentlyWorking && <span className="ml-1 text-xs">(live)</span>}
                              </span>
                            ) : (
                              <span className="text-gray-400">0.00h</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold border border-gray-300">
                            {totalHours > 0 ? (
                              <span className={isCurrentlyWorking ? "text-green-600" : "text-blue-600"}>
                                {totalHours.toFixed(2)}h
                                {isCurrentlyWorking && <span className="ml-1 text-xs font-normal">(live)</span>}
                              </span>
                            ) : (
                              <span className="text-gray-400">0.00h</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 border border-gray-300">
                            {record.location || "Office"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 border border-gray-300">
                            {record.notes || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
