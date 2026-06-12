"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { X } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Transaction {
  id?: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  debit_account: string;
  credit_account: string;
  status: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface TransactionFormProps {
  transaction?: Transaction | null;
  onClose: () => void;
}

export function TransactionForm({ transaction, onClose }: TransactionFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<Transaction>({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    amount: 0,
    debit_account: "",
    credit_account: "",
    status: "posted",
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccounts();
    if (transaction) {
      setFormData({
        ...transaction,
        date: transaction.date.split("T")[0],
      });
    } else {
      generateReference();
    }
  }, [transaction]);

  const loadAccounts = async () => {
    try {
      const response = await apiClient.get("/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const generateReference = async () => {
    try {
      const response = await apiClient.get("/transactions/generate-reference");
      setFormData((prev) => ({ ...prev, reference: response.data.reference }));
    } catch (error) {
      console.error("Failed to generate reference:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Transform formData to match backend expectations
      const payload = {
        date: formData.date,
        reference: formData.reference,
        description: formData.description,
        amount: formData.amount,
        debit_account_id: formData.debit_account,
        credit_account_id: formData.credit_account,
        status: formData.status,
      };

      if (transaction?.id) {
        await apiClient.put(`/transactions/${transaction.id}`, payload);
        toast.success("Transaction updated successfully!");
      } else {
        await apiClient.post("/transactions", payload);
        toast.success("Transaction created successfully!");
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to save transaction";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reference *
              </label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., TXN-2024-0001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter transaction description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Debit Account *
              </label>
              <select
                value={formData.debit_account}
                onChange={(e) => setFormData({ ...formData, debit_account: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Credit Account *
              </label>
              <select
                value={formData.credit_account}
                onChange={(e) => setFormData({ ...formData, credit_account: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select account</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="text-sm font-semibold mb-2">Transaction Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debit:</span>
                <span className="font-medium">
                  {accounts.find((a) => a.id === formData.debit_account)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit:</span>
                <span className="font-medium">
                  {accounts.find((a) => a.id === formData.credit_account)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(formData.amount || 0)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Saving..." : transaction ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
