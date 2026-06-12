"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { AccountForm } from "@/components/account-form";
import { AccountDetailModal } from "@/components/account-detail-modal";
import { Plus, Edit, Trash2, Search, Eye } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    filterAccounts();
  }, [accounts, searchTerm, filterType]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterAccounts = () => {
    let filtered = accounts;

    // Filter out inactive (deleted) accounts
    filtered = filtered.filter((account) => account.is_active);

    if (searchTerm) {
      filtered = filtered.filter(
        (account) =>
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((account) => account.type === filterType);
    }

    setFilteredAccounts(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await apiClient.delete(`/accounts/${id}`);
      loadAccounts();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAccount(null);
    loadAccounts();
  };

  const accountTypes = ["all", "asset", "liability", "equity", "revenue", "expense"];

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
          <h2 className="text-3xl font-bold tracking-tight">Chart of Accounts</h2>
          <p className="text-muted-foreground">
            Manage your accounting structure and account balances
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {accountTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Accounts Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Balance
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
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {account.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {account.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                      {account.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {account.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: account.currency,
                    }).format(account.balance)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        account.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {account.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setViewingAccount(account)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(account)}
                        className="text-primary hover:text-primary/80"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAccounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No accounts found</p>
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      {showForm && (
        <AccountForm
          account={editingAccount}
          onClose={handleFormClose}
        />
      )}

      {/* Account Detail Modal */}
      {viewingAccount && (
        <AccountDetailModal
          account={viewingAccount}
          onClose={() => setViewingAccount(null)}
        />
      )}
    </div>
  );
}
