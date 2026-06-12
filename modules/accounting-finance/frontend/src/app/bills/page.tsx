"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, FileText, DollarSign, Calendar, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";

interface Bill {
  id: string;
  bill_number: string;
  vendor_id: string;
  bill_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  payment_terms: string | null;
}

interface Vendor {
  id: string;
  company_name: string;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsRes, vendorsRes] = await Promise.all([
        apiClient.get("/ap-ar/bills"),
        apiClient.get("/ap-ar/vendors"),
      ]);

      setBills(billsRes.data);
      setVendors(vendorsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getVendorName = (vendorId: string) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    return vendor?.company_name || "Unknown Vendor";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", icon: FileText, label: "Draft" },
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      approved: { color: "bg-blue-100 text-blue-800", icon: CheckCircle, label: "Approved" },
      paid: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Paid" },
      partially_paid: { color: "bg-orange-100 text-orange-800", icon: DollarSign, label: "Partially Paid" },
      overdue: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Overdue" },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: XCircle, label: "Cancelled" },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredBills = filterStatus === "all"
    ? bills
    : bills.filter((bill) => bill.status === filterStatus);

  const totalPayable = bills
    .filter((b) => b.status !== "paid" && b.status !== "cancelled")
    .reduce((sum, b) => sum + b.amount_due, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bills</h2>
          <p className="text-muted-foreground">
            Manage vendor bills and accounts payable
          </p>
        </div>
        <Link
          href="/bills/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Bill
        </Link>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Payable</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalPayable)}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Overdue</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(
                bills
                  .filter((b) => new Date(b.due_date) < new Date() && b.amount_due > 0)
                  .reduce((sum, b) => sum + b.amount_due, 0)
              )}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Paid This Month</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(
                bills
                  .filter((b) => b.status === "paid")
                  .reduce((sum, b) => sum + b.amount_paid, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "pending", "approved", "partially_paid", "overdue", "paid"].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              filterStatus === status
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {status === "all" ? "All" : status.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </button>
        ))}
      </div>

      {/* Bills Table */}
      {filteredBills.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Bill Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Amount Due
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{bill.bill_number}</td>
                    <td className="px-6 py-4 text-sm">{getVendorName(bill.vendor_id)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(bill.bill_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(bill.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(bill.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(bill.amount_due)}
                    </td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(bill.status)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/bills/${bill.id}`}
                        className="text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Bills Found</h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus !== "all"
              ? `No bills with status: ${filterStatus}`
              : "Get started by creating your first bill"}
          </p>
          {filterStatus === "all" && (
            <Link
              href="/bills/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Bill
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
