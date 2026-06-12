"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AIInsight {
  type: string;
  title: string;
  message: string;
  severity: string;
  metric?: number;
  change?: number;
}

interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface Forecast {
  month: string;
  predicted_revenue: number;
  confidence_lower: number;
  confidence_upper: number;
}

interface Anomaly {
  date: string;
  transaction_id: string;
  description: string;
  amount: number;
  reason: string;
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(6); // months

  useEffect(() => {
    loadAllInsights();
  }, [selectedPeriod]);

  const loadAllInsights = async () => {
    try {
      setLoading(true);

      // Load data in parallel
      const [insightsRes, trendsRes, forecastRes, anomaliesRes] = await Promise.all([
        apiClient.get("/ai/insights").catch(() => ({ data: [] })),
        apiClient.get(`/reports/monthly-trends?months=${selectedPeriod}`).catch(() => ({ data: [] })),
        apiClient.get(`/ai/forecast?months=6`).catch(() => ({ data: [] })),
        apiClient.get("/ai/anomalies").catch(() => ({ data: [] })),
      ]);

      setInsights(insightsRes.data || []);
      setTrends(trendsRes.data || []);
      setForecast(forecastRes.data || []);
      setAnomalies(anomaliesRes.data || []);
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSeverityColor = (severity: string | undefined) => {
    if (!severity) return "bg-gray-100 text-gray-800 border-gray-200";

    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "success":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getSeverityIcon = (severity: string | undefined) => {
    if (!severity) return <Lightbulb className="h-5 w-5" />;

    switch (severity.toLowerCase()) {
      case "critical":
        return <AlertTriangle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Lightbulb className="h-5 w-5" />;
      case "success":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  // Calculate key metrics
  const latestTrend = trends[trends.length - 1];
  const previousTrend = trends[trends.length - 2];

  const revenueChange = latestTrend && previousTrend
    ? ((latestTrend.revenue - previousTrend.revenue) / previousTrend.revenue) * 100
    : 0;

  const profitChange = latestTrend && previousTrend
    ? ((latestTrend.profit - previousTrend.profit) / previousTrend.profit) * 100
    : 0;

  const averageProfit = trends.length > 0
    ? trends.reduce((sum, t) => sum + t.profit, 0) / trends.length
    : 0;

  const profitMargin = latestTrend && latestTrend.revenue > 0
    ? (latestTrend.profit / latestTrend.revenue) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Financial Insights & Analysis
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights and trends to help you understand your financial health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Period:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>12 Months</option>
          </select>
        </div>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Current Revenue</span>
            <span className="text-xl font-bold text-gray-900">
              {latestTrend ? formatCurrency(latestTrend.revenue) : "$0"}
            </span>
            {revenueChange !== 0 && (
              <span className={`text-xs font-medium ${
                revenueChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {revenueChange > 0 ? '↑' : '↓'}{Math.abs(revenueChange).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Current Profit</span>
            <span className="text-xl font-bold text-gray-900">
              {latestTrend ? formatCurrency(latestTrend.profit) : "$0"}
            </span>
            {profitChange !== 0 && (
              <span className={`text-xs font-medium ${
                profitChange > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {profitChange > 0 ? '↑' : '↓'}{Math.abs(profitChange).toFixed(1)}%
              </span>
            )}
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Profit Margin</span>
            <span className="text-xl font-bold text-gray-900">{profitMargin.toFixed(1)}%</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Avg Monthly Profit</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(averageProfit)}</span>
          </div>
        </div>
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI-Powered Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(insight.severity)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {getSeverityIcon(insight.severity)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{insight.title}</h3>
                    <p className="text-sm">{insight.message}</p>
                    {insight.metric && (
                      <div className="mt-2 text-sm font-medium">
                        Value: {formatCurrency(insight.metric)}
                        {insight.change && (
                          <span className={`ml-2 ${insight.change > 0 ? 'text-green-700' : 'text-red-700'}`}>
                            ({insight.change > 0 ? '+' : ''}{insight.change.toFixed(1)}%)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue & Expenses Trend */}
      <div className="bg-card border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Revenue & Expenses Trend</h2>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                name="Revenue"
              />
              <Line
                type="monotone"
                dataKey="expenses"
                stroke="#ef4444"
                strokeWidth={2}
                name="Expenses"
              />
              <Line
                type="monotone"
                dataKey="profit"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Profit"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No trend data available
          </div>
        )}
      </div>

      {/* Profit Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Monthly Profit Comparison</h2>
          {trends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="profit" fill="#3b82f6" name="Profit">
                  {trends.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No data available
            </div>
          )}
        </div>

        {/* Revenue Forecast */}
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Revenue Forecast (AI)
          </h2>
          {forecast.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="predicted_revenue"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="Predicted"
                />
                <Line
                  type="monotone"
                  dataKey="confidence_upper"
                  stroke="#d8b4fe"
                  strokeDasharray="5 5"
                  name="Upper Bound"
                />
                <Line
                  type="monotone"
                  dataKey="confidence_lower"
                  stroke="#d8b4fe"
                  strokeDasharray="5 5"
                  name="Lower Bound"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">AI forecast not available</p>
              <p className="text-sm">Need more historical data to generate predictions</p>
            </div>
          )}
        </div>
      </div>

      {/* Anomalies / Unusual Transactions */}
      {anomalies.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Detected Anomalies
          </h2>
          <div className="space-y-3">
            {anomalies.map((anomaly, index) => (
              <div
                key={index}
                className="border-l-4 border-yellow-500 bg-yellow-50 p-4 rounded"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">
                        {new Date(anomaly.date).toLocaleDateString()}
                      </span>
                      <span className="text-sm font-mono text-muted-foreground">
                        {anomaly.transaction_id}
                      </span>
                    </div>
                    <p className="font-medium mb-1">{anomaly.description}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.reason}</p>
                  </div>
                  <div className="text-lg font-bold text-yellow-800">
                    {formatCurrency(anomaly.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights Footer */}
      <div className="mt-8 bg-muted/30 border rounded-lg p-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          About Financial Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          This page uses AI and machine learning to analyze your financial data and provide
          actionable insights. The system looks for trends, patterns, anomalies, and makes
          predictions to help you make better financial decisions. Insights are updated
          automatically as new transactions are recorded.
        </p>
      </div>
    </div>
  );
}
