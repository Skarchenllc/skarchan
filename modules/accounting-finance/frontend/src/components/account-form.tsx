"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { X } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Account {
  id?: string;
  code: string;
  name: string;
  type: string;
  category: string;
  balance: number;
  currency: string;
  is_active: boolean;
}

interface AccountFormProps {
  account?: Account | null;
  onClose: () => void;
}

export function AccountForm({ account, onClose }: AccountFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<Account>({
    code: "",
    name: "",
    type: "asset",
    category: "",
    balance: 0,
    currency: "USD",
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (account) {
      setFormData(account);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (account?.id) {
        await apiClient.put(`/accounts/${account.id}`, formData);
        toast.success("Account updated successfully!");
      } else {
        await apiClient.post("/accounts", formData);
        toast.success("Account created successfully!");
      }
      onClose();
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || "Failed to save account";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const accountTypes = [
    { value: "asset", label: "Asset" },
    { value: "liability", label: "Liability" },
    { value: "equity", label: "Equity" },
    { value: "revenue", label: "Revenue" },
    { value: "expense", label: "Expense" },
  ];

  const currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {account ? "Edit Account" : "New Account"}
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
                Account Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Account Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {accountTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Cash on Hand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Current Assets"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Opening Balance
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.balance}
                onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="is_active" className="ml-2 text-sm font-medium">
              Active Account
            </label>
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
              {loading ? "Saving..." : account ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
