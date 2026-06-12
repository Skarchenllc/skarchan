"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import { AccountDetailModal } from "@/components/accounting/account-detail-modal";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";
import { Plus, Edit, Trash2, Search, Eye, X } from "lucide-react";

interface Account {
  id: string;
  [key: string]: any; // Dynamic fields from database
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

    // Filter out inactive (deleted) accounts if is_active field exists
    filtered = filtered.filter((account) =>
      account.is_active !== false && account.deleted_flag !== true
    );

    if (searchTerm) {
      filtered = filtered.filter(
        (account) =>
          (account.account_name || account.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (account.account_code || account.code || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((account) =>
        (account.account_type || account.type) === filterType
      );
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

  const handleFormClose = async (savedRecord?: any) => {
    setShowForm(false);
    setEditingAccount(null);
    await loadAccounts();
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
                    {account.account_code || account.code || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {account.account_name || account.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                      {account.account_type || account.type || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {account.parent_account || account.category || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {account.current_balance || account.opening_balance || account.balance
                      ? new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: account.currency || "USD",
                        }).format(account.current_balance || account.opening_balance || account.balance || 0)
                      : "$0.00"}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                {editingAccount ? "Edit Account" : "New Account"}
              </h2>
              <button
                onClick={() => handleFormClose()}
                className="text-gray-600 hover:text-black"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <DynamicEntityForm
                entityType="chart_of_accounts"
                recordId={editingAccount?.id}
                onSave={handleFormClose}
                onCancel={() => handleFormClose()}
              />
            </div>
          </div>
        </div>
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
