"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, AlertCircle } from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Fetch employee by code
      const res = await fetch(`/api/hr/employees?employee_code=${employeeCode}`);

      if (!res.ok) {
        setError("Invalid employee code or password");
        setLoading(false);
        return;
      }

      const employees = await res.json();
      const employee = employees.find((e: any) => e.employee_code === employeeCode);

      if (!employee) {
        setError("Invalid employee code or password");
        setLoading(false);
        return;
      }

      // In a real app, validate password against hash
      // For demo, we'll just check if password is not empty
      if (!password) {
        setError("Please enter a password");
        setLoading(false);
        return;
      }

      // Store employee info in localStorage
      localStorage.setItem("employee_id", employee.id);
      localStorage.setItem("employee_code", employee.employee_code);
      localStorage.setItem("employee_name", `${employee.first_name} ${employee.last_name}`);

      // Redirect to employee portal
      router.push("/employee-portal/dashboard");
    } catch (err) {
      setError("Failed to login. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Employee Portal</h1>
          <p className="text-blue-100">Sign in to access your workspace</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Employee Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your employee code"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <strong>Demo:</strong> Use any employee code from the system. Password: any text
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-blue-100">
            Need help? Contact <a href="#" className="font-medium text-white hover:underline">HR Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
