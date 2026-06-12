"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import { ArrowLeft, Download, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface CashFlowData {
  start_date: string;
  end_date: string;
  operating_activities: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  investing_activities: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  financing_activities: {
    items: Array<{ name: string; amount: number }>;
    total: number;
  };
  net_cash_flow: number;
  beginning_cash: number;
  ending_cash: number;
}

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const [startDate, setStartDate] = useState(firstDay.toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split("T")[0]);

  useEffect(() => {
    loadCashFlow();
  }, [startDate, endDate]);

  const loadCashFlow = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(
        `/reports/cash-flow?start_date=${startDate}&end_date=${endDate}`
      );
      setData(response.data);
    } catch (error) {
      console.error("Failed to load cash flow:", error);
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
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 print:hidden"
        >
          <Download className="h-4 w-4" />
          Print / Export
        </button>
      </div>

      {/* Date Range */}
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
        <h1 className="text-3xl font-bold mb-2">Cash Flow Statement</h1>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Operating Activities */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Cash Flows from Operating Activities</h2>
          <div className="space-y-2 ml-4">
            {data.operating_activities.items.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>{item.name}</span>
                <span className={`font-mono ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {item.amount >= 0 ? '' : '('}
                  {formatCurrency(item.amount)}
                  {item.amount >= 0 ? '' : ')'}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
              <span>Net Cash from Operating Activities</span>
              <span className={`font-mono ${data.operating_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.operating_activities.total >= 0 ? '' : '('}
                {formatCurrency(data.operating_activities.total)}
                {data.operating_activities.total >= 0 ? '' : ')'}
              </span>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Cash Flows from Investing Activities</h2>
          <div className="space-y-2 ml-4">
            {data.investing_activities.items.length > 0 ? (
              <>
                {data.investing_activities.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className={`font-mono ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '' : '('}
                      {formatCurrency(item.amount)}
                      {item.amount >= 0 ? '' : ')'}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
                  <span>Net Cash from Investing Activities</span>
                  <span className={`font-mono ${data.investing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.investing_activities.total >= 0 ? '' : '('}
                    {formatCurrency(data.investing_activities.total)}
                    {data.investing_activities.total >= 0 ? '' : ')'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground italic">No investing activities in this period</p>
            )}
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-bold mb-4">Cash Flows from Financing Activities</h2>
          <div className="space-y-2 ml-4">
            {data.financing_activities.items.length > 0 ? (
              <>
                {data.financing_activities.items.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.name}</span>
                    <span className={`font-mono ${item.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.amount >= 0 ? '' : '('}
                      {formatCurrency(item.amount)}
                      {item.amount >= 0 ? '' : ')'}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-lg font-bold pt-3 border-t-2">
                  <span>Net Cash from Financing Activities</span>
                  <span className={`font-mono ${data.financing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {data.financing_activities.total >= 0 ? '' : '('}
                    {formatCurrency(data.financing_activities.total)}
                    {data.financing_activities.total >= 0 ? '' : ')'}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground italic">No financing activities in this period</p>
            )}
          </div>
        </div>

        {/* Net Cash Flow */}
        <div className={`rounded-lg border-4 p-6 ${
          data.net_cash_flow >= 0
            ? 'bg-green-50 border-green-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Net Increase (Decrease) in Cash</span>
              <span className={`font-mono font-bold ${
                data.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {data.net_cash_flow >= 0 ? '' : '('}
                {formatCurrency(data.net_cash_flow)}
                {data.net_cash_flow >= 0 ? '' : ')'}
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="font-semibold">Cash at Beginning of Period</span>
              <span className="font-mono font-bold">
                {formatCurrency(data.beginning_cash)}
              </span>
            </div>
            <div className="flex justify-between text-2xl pt-3 border-t-2 border-current">
              <span className="font-bold">Cash at End of Period</span>
              <span className="font-mono font-bold">
                {formatCurrency(data.ending_cash)}
              </span>
            </div>
          </div>
        </div>

        {/* Cash Flow Summary */}
        <div className="grid grid-cols-3 gap-4 print:hidden">
          <div className={`border rounded-lg p-4 ${
            data.operating_activities.total >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Operating</span>
              {data.operating_activities.total >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              data.operating_activities.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(data.operating_activities.total)}
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${
            data.investing_activities.total >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Investing</span>
              {data.investing_activities.total >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              data.investing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(data.investing_activities.total)}
            </div>
          </div>

          <div className={`border rounded-lg p-4 ${
            data.financing_activities.total >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Financing</span>
              {data.financing_activities.total >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className={`text-xl font-bold ${
              data.financing_activities.total >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(data.financing_activities.total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
