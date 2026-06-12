"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, ArrowLeft, Edit, Trash2, Building2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/context/toast-context";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface BankAccount {
  id: string;
  account_id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
  currency: string;
  is_active: boolean;
  last_reconciled_date: string | null;
  last_reconciled_balance: number;
  created_at: string;
}

export default function BankAccountsPage() {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    account_id: "",
    bank_name: "",
    account_number: "",
    account_type: "Checking",
    currency: "USD",
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bankAccountsRes, accountsRes] = await Promise.all([
        apiClient.get("/bank-reconciliation/bank-accounts"),
        apiClient.get("/accounts"),
      ]);

      setBankAccounts(bankAccountsRes.data);
      // Filter for asset accounts (type is lowercase in API)
      setAccounts(accountsRes.data.filter((acc: Account) =>
        acc.type.toLowerCase() === "asset" || acc.type === "ASSET"
      ));
    } catch (error) {
      console.error("Failed to load data:", error);
      showToast("Failed to load bank accounts", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiClient.put(`/bank-reconciliation/bank-accounts/${editingId}`, formData);
        showToast("Bank account updated successfully", "success");
      } else {
        await apiClient.post("/bank-reconciliation/bank-accounts", formData);
        showToast("Bank account created successfully", "success");
      }

      resetForm();
      loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to save bank account",
        "error"
      );
    }
  };

  const handleEdit = (bankAccount: BankAccount) => {
    setFormData({
      account_id: bankAccount.account_id,
      bank_name: bankAccount.bank_name,
      account_number: bankAccount.account_number,
      account_type: bankAccount.account_type,
      currency: bankAccount.currency,
      is_active: bankAccount.is_active,
    });
    setEditingId(bankAccount.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bank account?")) {
      return;
    }

    try {
      // Instead of deleting, we'll deactivate
      await apiClient.put(`/bank-reconciliation/bank-accounts/${id}`, {
        is_active: false,
      });
      showToast("Bank account deactivated successfully", "success");
      loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to delete bank account",
        "error"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      account_id: "",
      bank_name: "",
      account_number: "",
      account_type: "Checking",
      currency: "USD",
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
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
          <div className="flex items-center gap-4 mb-2">
            <Link
              href="/reconciliation"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reconciliation
            </Link>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Accounts</h2>
          <p className="text-muted-foreground">
            Manage bank accounts for reconciliation
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Bank Account
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Bank Account" : "Add Bank Account"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Linked Account <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.account_id}
                  onChange={(e) =>
                    setFormData({ ...formData, account_id: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select an account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Link this bank account to a chart of accounts entry
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) =>
                    setFormData({ ...formData, bank_name: e.target.value })
                  }
                  required
                  placeholder="e.g., Chase Bank"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) =>
                    setFormData({ ...formData, account_number: e.target.value })
                  }
                  required
                  placeholder="e.g., ****1234"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) =>
                    setFormData({ ...formData, account_type: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="Checking">Checking</option>
                  <option value="Savings">Savings</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Money Market">Money Market</option>
                  <option value="Line of Credit">Line of Credit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData({ ...formData, currency: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="AUD">AUD - Australian Dollar</option>
                </select>
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {editingId ? "Update" : "Create"} Bank Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Accounts List */}
      {bankAccounts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bankAccounts.map((bankAccount) => (
            <div
              key={bankAccount.id}
              className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{bankAccount.bank_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {bankAccount.account_number}
                    </p>
                  </div>
                </div>
                {bankAccount.is_active ? (
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Active
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{bankAccount.account_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Currency:</span>
                  <span className="font-medium">{bankAccount.currency}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Last Reconciled</p>
                <p className="text-sm font-medium">
                  {formatDate(bankAccount.last_reconciled_date)}
                </p>
                {bankAccount.last_reconciled_date && (
                  <p className="text-sm text-muted-foreground">
                    Balance: {formatCurrency(bankAccount.last_reconciled_balance)}
                  </p>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEdit(bankAccount)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(bankAccount.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Bank Accounts</h3>
          <p className="text-muted-foreground mb-4">
            Add your first bank account to start reconciling transactions
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Bank Account
          </button>
        </div>
      )}
    </div>
  );
}
