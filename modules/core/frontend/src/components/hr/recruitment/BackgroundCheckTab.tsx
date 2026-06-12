"use client";

import { Shield, CheckCircle, AlertTriangle, Clock, Plus, Eye } from "lucide-react";

interface BackgroundCheck {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  initiated_date: string;
  completed_date?: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  check_type: string;
  provider: string;
  result?: "clear" | "issues_found" | "requires_review";
  notes?: string;
}

interface BackgroundCheckTabProps {
  backgroundChecks: BackgroundCheck[];
}

export function BackgroundCheckTab({ backgroundChecks }: BackgroundCheckTabProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getResultColor = (result?: string) => {
    switch (result) {
      case "clear": return "bg-green-100 text-green-800";
      case "issues_found": return "bg-red-100 text-red-800";
      case "requires_review": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getResultIcon = (result?: string) => {
    switch (result) {
      case "clear": return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "issues_found": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "requires_review": return <Eye className="w-5 h-5 text-yellow-600" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Background Checks</h2>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          <span>Initiate Check</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow divide-y">
        {backgroundChecks.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Background Checks Yet</h3>
          </div>
        ) : (
          backgroundChecks.map((check) => (
            <div key={check.id} className="p-6 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getResultIcon(check.result)}
                    <h3 className="text-lg font-semibold text-gray-900">{check.applicant_name}</h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.status)}`}>
                      {check.status.replace("_", " ")}
                    </span>
                    {check.result && (
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getResultColor(check.result)}`}>
                        {check.result.replace("_", " ")}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Check Type</p>
                      <p className="font-medium text-gray-900">{check.check_type}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Provider</p>
                      <p className="font-medium text-gray-900">{check.provider}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Initiated</p>
                      <p className="font-medium text-gray-900">
                        {new Date(check.initiated_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Completed</p>
                      <p className="font-medium text-gray-900">
                        {check.completed_date ? new Date(check.completed_date).toLocaleDateString() : "Pending"}
                      </p>
                    </div>
                  </div>

                  {check.notes && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Notes:</p>
                      <p className="text-sm text-gray-900">{check.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {check.status === "completed" && (
                    <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>View Report</span>
                    </button>
                  )}
                  {check.status === "in_progress" && (
                    <button className="px-3 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition text-sm">
                      Check Status
                    </button>
                  )}
                  {check.result === "requires_review" && (
                    <button className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm">
                      Review
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Summary Cards */}
      {backgroundChecks.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Checks</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{backgroundChecks.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {backgroundChecks.filter(c => c.status === "in_progress").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {backgroundChecks.filter(c => c.status === "completed").length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Issues Found</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {backgroundChecks.filter(c => c.result === "issues_found").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
