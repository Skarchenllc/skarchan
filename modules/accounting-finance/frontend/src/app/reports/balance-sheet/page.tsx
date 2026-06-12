"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { ArrowLeft, Download, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface BalanceSheetData {
  as_of_date: string;
  assets: {
    current_assets: {
      accounts: Array<{ name: string; balance: number }>;
      total: number;
    };
    fixed_assets: {
      accounts: Array<{ name: string; balance: number }>;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current_liabilities: {
      accounts: Array<{ name: string; balance: number }>;
      total: number;
    };
    long_term_liabilities: {
      accounts: Array<{ name: string; balance: number }>;
      total: number;
    };
    total: number;
  };
  equity: {
    accounts: Array<{ name: string; balance: number }>;
    total: number;
  };
  total_liabilities_and_equity: number;
}

export default function BalanceSheetPage() {
  const [data, setData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadBalanceSheet();
  }, [selectedDate]);

  const loadBalanceSheet = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/reports/balance-sheet?as_of_date=${selectedDate}`);
      setData(response.data);
    } catch (error) {
      console.error("Failed to load balance sheet:", error);
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
            Unable to load balance sheet data.
          </p>
        </div>
      </div>
    );
  }

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
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
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

      {/* Report Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Balance Sheet</h1>
        <p className="text-lg text-muted-foreground">
          As of {formatDate(data.as_of_date)}
        </p>
      </div>

      {/* Assets Section */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Assets
        </h2>

        {/* Current Assets */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            Current Assets
          </h3>
          <div className="space-y-2 ml-4">
            {data.assets.current_assets.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Current Assets</span>
              <span className="font-mono">
                {formatCurrency(data.assets.current_assets.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Fixed Assets */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            Fixed Assets
          </h3>
          <div className="space-y-2 ml-4">
            {data.assets.fixed_assets.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Fixed Assets</span>
              <span className="font-mono">
                {formatCurrency(data.assets.fixed_assets.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Assets */}
        <div className="flex justify-between text-xl font-bold pt-4 border-t-2 border-primary">
          <span>TOTAL ASSETS</span>
          <span className="font-mono">
            {formatCurrency(data.assets.total)}
          </span>
        </div>
      </div>

      {/* Liabilities Section */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-500" />
          Liabilities
        </h2>

        {/* Current Liabilities */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            Current Liabilities
          </h3>
          <div className="space-y-2 ml-4">
            {data.liabilities.current_liabilities.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Current Liabilities</span>
              <span className="font-mono">
                {formatCurrency(data.liabilities.current_liabilities.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Long-term Liabilities */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground">
            Long-term Liabilities
          </h3>
          <div className="space-y-2 ml-4">
            {data.liabilities.long_term_liabilities.accounts.map((account, index) => (
              <div key={index} className="flex justify-between">
                <span>{account.name}</span>
                <span className="font-mono">
                  {formatCurrency(account.balance)}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 border-t">
              <span>Total Long-term Liabilities</span>
              <span className="font-mono">
                {formatCurrency(data.liabilities.long_term_liabilities.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Total Liabilities */}
        <div className="flex justify-between text-lg font-bold pt-4 border-t-2">
          <span>TOTAL LIABILITIES</span>
          <span className="font-mono">
            {formatCurrency(data.liabilities.total)}
          </span>
        </div>
      </div>

      {/* Equity Section */}
      <div className="bg-card rounded-lg border p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Owner's Equity</h2>
        <div className="space-y-2 ml-4">
          {data.equity.accounts.map((account, index) => (
            <div key={index} className="flex justify-between">
              <span>{account.name}</span>
              <span className="font-mono">
                {formatCurrency(account.balance)}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-lg font-bold pt-4 border-t-2">
            <span>TOTAL EQUITY</span>
            <span className="font-mono">
              {formatCurrency(data.equity.total)}
            </span>
          </div>
        </div>
      </div>

      {/* Total Liabilities + Equity */}
      <div className="bg-primary/10 rounded-lg border-2 border-primary p-6">
        <div className="flex justify-between text-2xl font-bold">
          <span>TOTAL LIABILITIES & EQUITY</span>
          <span className="font-mono">
            {formatCurrency(data.total_liabilities_and_equity)}
          </span>
        </div>
      </div>

      {/* Balance Check */}
      <div className="mt-6 text-center">
        {Math.abs(data.assets.total - data.total_liabilities_and_equity) < 0.01 ? (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-md">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Balance Sheet is balanced
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 rounded-md">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Balance Sheet is out of balance by{" "}
            {formatCurrency(
              data.assets.total - data.total_liabilities_and_equity
            )}
          </div>
        )}
      </div>
    </div>
  );
}
