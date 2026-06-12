"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, FileText, DollarSign, Calendar, CheckCircle, Clock, XCircle, Eye } from "lucide-react";
import Link from "next/link";

interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  status: string;
  payment_terms: string | null;
}

interface Customer {
  id: string;
  company_name: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [invoicesRes, customersRes] = await Promise.all([
        apiClient.get("/ap-ar/invoices"),
        apiClient.get("/ap-ar/customers"),
      ]);

      setInvoices(invoicesRes.data);
      setCustomers(customersRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    return customer?.company_name || "Unknown Customer";
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", icon: FileText, label: "Draft" },
      sent: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Sent" },
      viewed: { color: "bg-purple-100 text-purple-800", icon: Eye, label: "Viewed" },
      partially_paid: { color: "bg-orange-100 text-orange-800", icon: DollarSign, label: "Partially Paid" },
      paid: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Paid" },
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

  const filteredInvoices = filterStatus === "all"
    ? invoices
    : invoices.filter((invoice) => invoice.status === filterStatus);

  const totalReceivable = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + i.amount_due, 0);

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
          <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
          <p className="text-muted-foreground">
            Manage customer invoices and accounts receivable
          </p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Invoice
        </Link>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Receivable</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalReceivable)}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Overdue</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(
                invoices
                  .filter((i) => new Date(i.due_date) < new Date() && i.amount_due > 0)
                  .reduce((sum, i) => sum + i.amount_due, 0)
              )}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Collected This Month</span>
            <span className="text-xl font-bold text-gray-900">
              {formatCurrency(
                invoices
                  .filter((i) => i.status === "paid")
                  .reduce((sum, i) => sum + i.amount_paid, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {["all", "draft", "sent", "viewed", "partially_paid", "overdue", "paid"].map((status) => (
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

      {/* Invoices Table */}
      {filteredInvoices.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Invoice Date
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
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-sm">{getCustomerName(invoice.customer_id)}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(invoice.invoice_date)}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(invoice.due_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(invoice.amount_due)}
                    </td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(invoice.status)}</td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/invoices/${invoice.id}`}
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
          <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
          <p className="text-muted-foreground mb-4">
            {filterStatus !== "all"
              ? `No invoices with status: ${filterStatus}`
              : "Get started by creating your first invoice"}
          </p>
          {filterStatus === "all" && (
            <Link
              href="/invoices/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              New Invoice
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
