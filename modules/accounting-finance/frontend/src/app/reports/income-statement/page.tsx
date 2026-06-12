"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface IncomeStatementData {
  start_date: string;
  end_date: string;
  revenue: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  cost_of_goods_sold: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  gross_profit: number;
  operating_expenses: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  operating_income: number;
  other_income: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  other_expenses: {
    accounts: Array<{ name: string; amount: number }>;
    total: number;
  };
  net_income: number;
}

export default function IncomeStatementPage() {
  const [data, setData] = useState<IncomeStatementData | null>(null);
  const [loading, setLoading] = useState(true);

  // Default to current month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  useEffect(() => {
    loadIncomeStatement();
  }, [startDate, endDate]);

  const loadIncomeStatement = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/reports/income-statement?start_date=${startDate}&end_date=${endDate}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Failed to load income statement:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleQuickPeriod = (period: string) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (period) {
      case "month":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "quarter":
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case "year":
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case "last-month":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">No Data Available</h2>
          <p className="text-muted-foreground">
            Unable to load income statement data.
          </p>
        </div>
      </div>
    );
  }

  const grossMargin = data.revenue.total > 0
    ? (data.gross_profit / data.revenue.total) * 100
    : 0;

  const netMargin = data.revenue.total > 0
    ? (data.net_income / data.revenue.total) * 100
    : 0;

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <div className="flex items-center gap-4">
          <Link
            href="/reports"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickPeriod("month")}
              className="px-3 py-1 text-sm border rounded-md hover:bg-accent"
            >
              This Month
            </button>
            <button
              onClick={() => handleQuickPeriod("quarter")}
              className="px-3 py-1 text-sm border rounded-md hover:bg-accent"
            >
              This Quarter
            </button>
            <button
              onClick={() => handleQuickPeriod("year")}
              className="px-3 py-1 text-sm border rounded-md hover:bg-accent"
            >
              This Year
            </button>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Download className="h-4 w-4" />
            Print / Export
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center justify-center gap-4 mb-6 print:hidden">
        <div>
          <label className="block text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-6">to</div>
        <div>
          <label className="block text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Report Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Income Statement</h1>
        <p className="text-lg text-muted-foreground">
          {formatDate(data.start_date)} - {formatDate(data.end_date)}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Revenue Section */}
        <div className="bg-card rounded-lg border p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Revenue
          </h2>
          <div className="space-y-2 ml-4">
            {data.revenue.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono text-green-600">
                  {formatCurrency(account.amount)}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-green-500">
              <span>TOTAL REVENUE</span>
              <span className="font-mono text-green-600">
                {formatCurrency(data.revenue.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Cost of Goods Sold */}
        {data.cost_of_goods_sold.accounts.length > 0 && (
          <div className="bg-card rounded-lg border p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Cost of Goods Sold</h2>
            <div className="space-y-2 ml-4">
              {data.cost_of_goods_sold.accounts.map((account, index) => (
                <div key={index} className="flex justify-between">
                  <span>{account.name}</span>
                  <span className="font-mono text-red-600">
                    ({formatCurrency(account.amount)})
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-2 border-t">
                <span>Total COGS</span>
                <span className="font-mono text-red-600">
                  ({formatCurrency(data.cost_of_goods_sold.total)})
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Gross Profit */}
        <div className="bg-primary/10 rounded-lg border-2 border-primary p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold">GROSS PROFIT</h3>
              <p className="text-sm text-muted-foreground">
                Margin: {grossMargin.toFixed(1)}%
              </p>
            </div>
            <span className="text-2xl font-bold font-mono">
              {formatCurrency(data.gross_profit)}
            </span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-card rounded-lg border p-6 mb-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            Operating Expenses
          </h2>
          <div className="space-y-2 ml-4">
            {data.operating_expenses.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono text-red-600">
                  ({formatCurrency(account.amount)})
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total Operating Expenses</span>
              <span className="font-mono text-red-600">
                ({formatCurrency(data.operating_expenses.total)})
              </span>
            </div>
          </div>
        </div>

        {/* Operating Income */}
        <div className="bg-blue-50 rounded-lg border-2 border-blue-500 p-6 mb-6">
          <div className="flex justify-between text-lg font-bold">
            <span>OPERATING INCOME</span>
            <span className="font-mono">
              {formatCurrency(data.operating_income)}
            </span>
          </div>
        </div>

        {/* Other Income/Expenses */}
        {(data.other_income.accounts.length > 0 || data.other_expenses.accounts.length > 0) && (
          <div className="bg-card rounded-lg border p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Other Income & Expenses</h2>

            {data.other_income.accounts.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-muted-foreground">Other Income</h3>
                <div className="space-y-2 ml-4">
                  {data.other_income.accounts.map((account, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{account.name}</span>
                      <span className="font-mono text-green-600">
                        {formatCurrency(account.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.other_expenses.accounts.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-muted-foreground">Other Expenses</h3>
                <div className="space-y-2 ml-4">
                  {data.other_expenses.accounts.map((account, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{account.name}</span>
                      <span className="font-mono text-red-600">
                        ({formatCurrency(account.amount)})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Net Income */}
        <div className={`rounded-lg border-4 p-6 ${
          data.net_income >= 0
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-2xl font-bold">
                NET {data.net_income >= 0 ? 'INCOME' : 'LOSS'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Net Margin: {netMargin.toFixed(1)}%
              </p>
            </div>
            <span className={`text-3xl font-bold font-mono ${
              data.net_income >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {data.net_income < 0 && '('}
              {formatCurrency(data.net_income)}
              {data.net_income < 0 && ')'}
            </span>
          </div>
        </div>

        {/* Key Metrics Summary */}
        <div className="grid grid-cols-3 gap-4 mt-6 print:hidden">
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Gross Margin</div>
            <div className="text-2xl font-bold">{grossMargin.toFixed(1)}%</div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Operating Margin</div>
            <div className="text-2xl font-bold">
              {data.revenue.total > 0
                ? ((data.operating_income / data.revenue.total) * 100).toFixed(1)
                : 0}%
            </div>
          </div>
          <div className="bg-card border rounded-lg p-4 text-center">
            <div className="text-sm text-muted-foreground mb-1">Net Margin</div>
            <div className="text-2xl font-bold">{netMargin.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
