"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { TransactionFormEnhanced } from "@/components/transaction-form-enhanced";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";
import { TransactionEntrySelector } from "@/components/transaction-entry-selector";
import { TemplateSelector } from "@/components/template-selector";
import { TemplateForm } from "@/components/template-form";
import { TransactionTemplate } from "@/lib/transaction-templates";
import { Plus, Edit, Trash2, Search, Filter, Download, Eye } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  debit_account_id: string;
  credit_account_id: string;
  status: string;
  notes?: string;
  attachments?: string;
  created_at: string;
  updated_at: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

type EntryMode = "selector" | "template-selector" | "template-form" | "manual" | "edit" | null;

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVoided, setShowVoided] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([loadTransactions(), loadAccounts()]);
  };

  const loadAccounts = async () => {
    try {
      const response = await apiClient.get("/accounts");
      // Handle both wrapped and unwrapped responses
      const accountsData = response.data.accounts || response.data || [];
      setAccounts(accountsData);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      // Set empty array on error to prevent crashes
      setAccounts([]);
    }
  };

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, showVoided]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/transactions");
      // Handle both wrapped and unwrapped responses
      const transactionsData = response.data.transactions || response.data || [];
      setTransactions(transactionsData);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter out void transactions by default unless checkbox is checked
    if (!showVoided) {
      filtered = filtered.filter((transaction) => transaction.status !== "void");
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          transaction.reference.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;

    try {
      await apiClient.delete(`/transactions/${id}`);
      loadTransactions();
    } catch (error: any) {
      console.error("Failed to delete transaction:", error);

      // Handle validation errors (array of objects) or string errors
      let errorMessage = "Failed to delete transaction. Posted transactions cannot be deleted.";
      const detail = error.response?.data?.detail;

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors - format them nicely
        errorMessage = detail.map((e: any) => {
          const field = e.loc?.join(".") || "field";
          return `${field}: ${e.msg}`;
        }).join(", ");
      } else if (detail && typeof detail === "object") {
        errorMessage = JSON.stringify(detail);
      }

      alert(errorMessage);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setEntryMode("edit");
  };

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setEntryMode("selector");
  };

  const handleEntryModeSelect = (mode: "ai" | "scan" | "template" | "manual") => {
    if (mode === "template") {
      setEntryMode("template-selector");
    } else if (mode === "manual") {
      setEntryMode("manual");
    }
    // AI and scan modes will be implemented in future phases
  };

  const handleTemplateSelect = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setEntryMode("template-form");
  };

  const handleCloseAll = () => {
    setEntryMode(null);
    setSelectedTemplate(null);
    setEditingTransaction(null);
    loadTransactions();
  };

  const handleBackToSelector = () => {
    setEntryMode("selector");
    setSelectedTemplate(null);
  };

  const handleBackToTemplateSelector = () => {
    setEntryMode("template-selector");
    setSelectedTemplate(null);
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : accountId;
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.get("/transactions/export", {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export transactions:", error);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Record and manage all financial transactions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleNewTransaction}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <label className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-accent">
          <input
            type="checkbox"
            checked={showVoided}
            onChange={(e) => setShowVoided(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm">Show Voided</span>
        </label>
      </div>

      {/* Transactions Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Debit Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Credit Account
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {format(new Date(transaction.date), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {transaction.reference}
                  </td>
                  <td className="px-6 py-4 text-sm max-w-xs truncate">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {getAccountName(transaction.debit_account_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {getAccountName(transaction.credit_account_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                    }).format(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        transaction.status === "posted"
                          ? "bg-green-100 text-green-700"
                          : transaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : transaction.status === "reconciled"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingTransaction(transaction)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-primary hover:text-primary/80"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {transaction.status === "pending" && (
                        <button
                          onClick={() => handleDelete(transaction.id)}
                          className="text-destructive hover:text-destructive/80"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No transactions found</p>
          </div>
        )}
      </div>

      {/* Entry Mode Selector */}
      {entryMode === "selector" && (
        <TransactionEntrySelector
          onSelect={handleEntryModeSelect}
          onClose={handleCloseAll}
        />
      )}

      {/* Template Selector */}
      {entryMode === "template-selector" && (
        <TemplateSelector
          onSelect={handleTemplateSelect}
          onBack={handleBackToSelector}
        />
      )}

      {/* Template Form */}
      {entryMode === "template-form" && selectedTemplate && (
        <TemplateForm
          template={selectedTemplate}
          onBack={handleBackToTemplateSelector}
          onSuccess={handleCloseAll}
        />
      )}

      {/* Manual Entry Form */}
      {(entryMode === "manual" || entryMode === "edit") && (
        <TransactionFormEnhanced
          transaction={editingTransaction}
          onClose={handleCloseAll}
          onSuccess={loadTransactions}
        />
      )}

      {/* Transaction Detail Modal */}
      {viewingTransaction && (
        <TransactionDetailModal
          transaction={viewingTransaction}
          onClose={() => setViewingTransaction(null)}
        />
      )}
    </div>
  );
}
