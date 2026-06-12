"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  cashFlow: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

interface AccountBalance {
  name: string;
  value: number;
}

interface AIInsight {
  category: string;
  message: string;
  impact: string;
  confidence: number;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, chartRes, balancesRes, insightsRes] = await Promise.all([
        apiClient.get("/reports/metrics"),
        apiClient.get("/reports/monthly-trends"),
        apiClient.get("/reports/account-balances"),
        apiClient.get("/ai/insights"),
      ]);

      setMetrics(metricsRes.data);
      setChartData(chartRes.data);
      setAccountBalances(balancesRes.data);
      setAiInsights(insightsRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight">Financial Dashboard</h2>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Revenue</span>
            <span className="text-xl font-bold text-gray-900">
              ${(metrics?.totalRevenue || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Expenses</span>
            <span className="text-xl font-bold text-gray-900">
              ${(metrics?.totalExpenses || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Net Income</span>
            <span className="text-xl font-bold text-gray-900">
              ${(metrics?.netIncome || 0).toLocaleString()}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Cash Flow</span>
            <span className="text-xl font-bold text-gray-900">
              ${(metrics?.cashFlow || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Account Balances</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={accountBalances}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {accountBalances.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insights */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">AI-Powered Financial Insights</h3>
        <div className="space-y-4">
          {aiInsights.length > 0 ? (
            aiInsights.map((insight, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-primary">{insight.category}</p>
                    <p className="text-sm">{insight.message}</p>
                    <p className="text-xs text-muted-foreground">Impact: {insight.impact}</p>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {(insight.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No insights available. AI analysis will appear here as data is collected.
            </p>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="rounded-lg border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="revenue" fill="#3b82f6" />
            <Bar dataKey="expenses" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  change,
  icon,
}: {
  title: string;
  value: number;
  change: number;
  icon: React.ReactNode;
}) {
  const isPositive = change >= 0;
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium">{title}</h3>
        {icon}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{formattedValue}</div>
        {change !== 0 && (
          <p className="text-xs text-muted-foreground">
            <span className={isPositive ? "text-green-600" : "text-red-600"}>
              {isPositive ? "+" : ""}
              {change.toFixed(1)}%
            </span>{" "}
            from last month
          </p>
        )}
      </div>
    </div>
  );
}
