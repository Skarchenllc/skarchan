"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";
import { Plus, Edit, Trash2, Search, DollarSign, Star, X } from "lucide-react";

interface Currency {
  id: string;
  [key: string]: any; // Dynamic fields from database
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    filterCurrencies();
  }, [currencies, searchTerm]);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/currency/currencies");
      setCurrencies(response.data);
    } catch (error) {
      console.error("Failed to load currencies:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCurrencies = () => {
    let filtered = currencies;

    // Filter out inactive/deleted currencies
    filtered = filtered.filter((currency) =>
      currency.is_active !== false && currency.deleted_flag !== true
    );

    if (searchTerm) {
      filtered = filtered.filter(
        (currency) =>
          (currency.currency_name || currency.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (currency.currency_code || currency.code || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCurrencies(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this currency?")) return;

    try {
      await apiClient.delete(`/currency/currencies/${id}`);
      loadCurrencies();
    } catch (error) {
      console.error("Failed to delete currency:", error);
    }
  };

  const handleEdit = (currency: Currency) => {
    setEditingCurrency(currency);
    setShowForm(true);
  };

  const handleFormClose = async (savedRecord?: any) => {
    setShowForm(false);
    setEditingCurrency(null);
    await loadCurrencies();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const baseCurrency = currencies.find((c) => c.is_base_currency);
  const activeCurrencies = currencies.filter((c) => c.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Currencies</h2>
          <p className="text-muted-foreground">
            Manage currency configurations and exchange rates
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Currency
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Base Currency</span>
            <span className="text-xl font-bold text-gray-900">
              {baseCurrency ? `${baseCurrency.currency_code || baseCurrency.code}` : "Not Set"}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active Currencies</span>
            <span className="text-xl font-bold text-gray-900">{activeCurrencies.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Currencies</span>
            <span className="text-xl font-bold text-gray-900">{currencies.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search currencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Currencies Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Currency Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Base Currency
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
              {filteredCurrencies.map((currency) => (
                <tr key={currency.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {currency.currency_code || currency.code || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {currency.currency_name || currency.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {currency.symbol || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {currency.is_base_currency ? (
                      <Star className="h-4 w-4 text-yellow-500 inline" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        currency.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {currency.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(currency)}
                        className="text-primary hover:text-primary/80"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(currency.id)}
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

        {filteredCurrencies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No currencies found</p>
          </div>
        )}
      </div>

      {/* Currency Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                {editingCurrency ? "Edit Currency" : "New Currency"}
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
                entityType="currencies"
                recordId={editingCurrency?.id}
                onSave={handleFormClose}
                onCancel={() => handleFormClose()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
