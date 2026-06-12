"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, RefreshCw, CheckCircle, Clock, FileText } from "lucide-react";
import Link from "next/link";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  last_reconciled_date: string | null;
  last_reconciled_balance: number;
  is_active: boolean;
}

interface Reconciliation {
  id: string;
  bank_account_id: string;
  statement_date: string;
  statement_balance: number;
  book_balance: number;
  difference: number;
  status: string;
  reconciled_by: string | null;
  reconciled_at: string | null;
}

export default function BankReconciliationPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedAccount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, reconciliationsRes] = await Promise.all([
        apiClient.get("/bank-reconciliation/bank-accounts"),
        apiClient.get("/bank-reconciliation/reconciliations", {
          params: selectedAccount ? { bank_account_id: selectedAccount } : {},
        }),
      ]);

      setBankAccounts(accountsRes.data);
      setReconciliations(reconciliationsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
      draft: { color: "bg-gray-100 text-gray-800", icon: FileText, label: "Draft" },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "In Progress" },
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Completed" },
      approved: { color: "bg-purple-100 text-purple-800", icon: CheckCircle, label: "Approved" },
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
          <h2 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h2>
          <p className="text-muted-foreground">
            Match bank statements with your accounting records
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/reconciliation/bank-accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            <Plus className="h-4 w-4" />
            Manage Bank Accounts
          </Link>
          <Link
            href="/reconciliation/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Reconciliation
          </Link>
        </div>
      </div>

      {/* Bank Accounts Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {bankAccounts.map((account) => (
          <div
            key={account.id}
            className={`rounded-lg border bg-card p-6 cursor-pointer transition-all ${
              selectedAccount === account.id ? "ring-2 ring-primary" : "hover:shadow-md"
            }`}
            onClick={() => setSelectedAccount(selectedAccount === account.id ? "" : account.id)}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold">{account.bank_name}</h3>
                {account.is_active && (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Active
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {account.account_number} • {account.account_type}
              </p>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">Last Reconciled</p>
                {account.last_reconciled_date ? (
                  <>
                    <p className="text-sm font-medium">{formatDate(account.last_reconciled_date)}</p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {formatCurrency(account.last_reconciled_balance)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Never reconciled</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {bankAccounts.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your bank accounts for reconciliation
          </p>
          <Link
            href="/reconciliation/bank-accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Bank Account
          </Link>
        </div>
      )}

      {/* Reconciliations List */}
      {reconciliations.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {selectedAccount ? "Reconciliations for Selected Account" : "All Reconciliations"}
              </h3>
              <button
                onClick={loadData}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Statement Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Statement Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Book Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Reconciled By
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reconciliations.map((recon) => (
                  <tr key={recon.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm">{formatDate(recon.statement_date)}</td>
                    <td className="px-6 py-4 text-sm">{getStatusBadge(recon.status)}</td>
                    <td className="px-6 py-4 text-sm text-right font-medium">
                      {formatCurrency(recon.statement_balance)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      {formatCurrency(recon.book_balance)}
                    </td>
                    <td className={`px-6 py-4 text-sm text-right font-medium ${
                      Math.abs(recon.difference) < 0.01 ? "text-green-600" : "text-red-600"
                    }`}>
                      {formatCurrency(recon.difference)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {recon.reconciled_by || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <Link
                        href={`/reconciliation/${recon.id}`}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reconciliations.length === 0 && selectedAccount && (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">No Reconciliations Found</h3>
          <p className="text-muted-foreground mb-4">
            Start by creating a new reconciliation for this account
          </p>
          <Link
            href="/reconciliation/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            New Reconciliation
          </Link>
        </div>
      )}
    </div>
  );
}
