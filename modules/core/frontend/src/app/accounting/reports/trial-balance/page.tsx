"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import { ArrowLeft, Download, Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface TrialBalanceAccount {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  as_of_date: string;
  accounts: TrialBalanceAccount[];
  total_debits: number;
  total_credits: number;
  difference: number;
}

export default function TrialBalancePage() {
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadTrialBalance();
  }, [selectedDate]);

  const loadTrialBalance = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/reports/trial-balance?as_of_date=${selectedDate}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Failed to load trial balance:", error);
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
        </div>
      </div>
    );
  }

  const isBalanced = Math.abs(data.difference) < 0.01;

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <Link
          href="/accounting/reports"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground print:hidden"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
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
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-2">Trial Balance</h1>
      </div>

      {/* Balance Status */}
      {!isBalanced && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg print:hidden">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="h-5 w-5" />
            <div>
              <h3 className="font-bold">Trial Balance Out of Balance</h3>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-semibold">Account Code</th>
                <th className="text-left p-4 font-semibold">Account Name</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-right p-4 font-semibold">Debit</th>
                <th className="text-right p-4 font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map((account, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-muted/50 transition-colors"
                >
                  <td className="p-4 font-mono">{account.code}</td>
                  <td className="p-4">{account.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-muted rounded text-xs">
                      {account.type}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">
                    {account.debit > 0 ? formatCurrency(account.debit) : "-"}
                  </td>
                  <td className="p-4 text-right font-mono">
                    {account.credit > 0 ? formatCurrency(account.credit) : "-"}
                  </td>
                </tr>
              ))}

              {/* Totals Row */}
              <tr className="border-t-2 border-primary bg-primary/5 font-bold">
                <td colSpan={3} className="p-4 text-lg">
                  TOTALS
                </td>
                <td className="p-4 text-right font-mono text-lg">
                  {formatCurrency(data.total_debits)}
                </td>
                <td className="p-4 text-right font-mono text-lg">
                  {formatCurrency(data.total_credits)}
                </td>
              </tr>

              {/* Difference Row (if not balanced) */}
              {!isBalanced && (
                <tr className="border-t bg-red-50">
                  <td colSpan={3} className="p-4 text-red-800 font-bold">
                    DIFFERENCE
                  </td>
                  <td
                    colSpan={2}
                    className="p-4 text-right font-mono text-red-800 font-bold"
                  >
                    {formatCurrency(data.difference)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Verification */}
      <div className="mt-6 flex justify-center">
        {isBalanced ? (
          <div className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 rounded-lg border-2 border-green-500">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <div className="font-bold">Trial Balance is Balanced</div>
              <div className="text-sm">
                Total Debits = Total Credits ({formatCurrency(data.total_debits)})
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 rounded-lg border-2 border-red-500">
            <AlertCircle className="h-6 w-6" />
            <div>
              <div className="font-bold">Trial Balance is Out of Balance</div>
              <div className="text-sm">
                Please review transactions for errors
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 print:hidden">
        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Accounts</div>
          <div className="text-3xl font-bold">{data.accounts.length}</div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Debits</div>
          <div className="text-3xl font-bold text-red-600">
            {formatCurrency(data.total_debits)}
          </div>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <div className="text-sm text-muted-foreground mb-1">Total Credits</div>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.total_credits)}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-muted/30 border rounded-lg p-6 print:hidden">
        <h3 className="font-bold mb-2">About Trial Balance</h3>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Debit Balances:</span>
            <ul className="list-disc list-inside text-muted-foreground mt-1">
              <li>Assets</li>
              <li>Expenses</li>
              <li>Dividends</li>
            </ul>
          </div>
          <div>
            <span className="font-semibold">Credit Balances:</span>
            <ul className="list-disc list-inside text-muted-foreground mt-1">
              <li>Liabilities</li>
              <li>Equity</li>
              <li>Revenue</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
