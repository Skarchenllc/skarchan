"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, Star, StarOff, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string | null;
  exchange_rate: number;
  is_base_currency: boolean;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function CurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    symbol: "",
    exchange_rate: 1.0,
    is_base_currency: false,
    decimal_places: 2,
    is_active: true,
  });

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/currency/currencies");
      setCurrencies(response.data);
    } catch (error) {
      showToast("Failed to load currencies", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiClient.put(`/currency/currencies/${editingId}`, formData);
        showToast("Currency updated successfully", "success");
      } else {
        await apiClient.post("/currency/currencies", formData);
        showToast("Currency created successfully", "success");
      }

      resetForm();
      loadCurrencies();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to save currency",
        "error"
      );
    }
  };

  const handleEdit = (currency: Currency) => {
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol || "",
      exchange_rate: currency.exchange_rate,
      is_base_currency: currency.is_base_currency,
      decimal_places: currency.decimal_places,
      is_active: currency.is_active,
    });
    setEditingId(currency.id);
    setShowForm(true);
  };

  const handleSetBaseCurrency = async (currencyId: string) => {
    if (!confirm("Are you sure you want to set this as the base currency?")) {
      return;
    }

    try {
      await apiClient.post(`/currency/base-currency/${currencyId}`);
      showToast("Base currency updated successfully", "success");
      loadCurrencies();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to set base currency",
        "error"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      name: "",
      symbol: "",
      exchange_rate: 1.0,
      is_base_currency: false,
      decimal_places: 2,
      is_active: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const baseCurrency = currencies.find((c) => c.is_base_currency);
  const activeCurrencies = currencies.filter((c) => c.is_active);

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
          <h2 className="text-3xl font-bold tracking-tight">Multi-Currency</h2>
          <p className="text-muted-foreground">
            Manage currencies and exchange rates
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Currency
        </button>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Base Currency</span>
            <span className="text-xl font-bold text-gray-900">
              {baseCurrency ? `${baseCurrency.code}` : "Not Set"}
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
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Currencies</span>
            <span className="text-xl font-bold text-gray-900">{currencies.length}</span>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Currency" : "Add Currency"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Currency Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value.toUpperCase() })
                  }
                  required
                  maxLength={3}
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border rounded-md bg-background uppercase"
                  placeholder="USD"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Currency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="US Dollar"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Symbol</label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) =>
                    setFormData({ ...formData, symbol: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="$"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exchange Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.exchange_rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exchange_rate: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="1.0"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Rate relative to base currency
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Decimal Places
                </label>
                <input
                  type="number"
                  value={formData.decimal_places}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      decimal_places: parseInt(e.target.value) || 2,
                    })
                  }
                  min={0}
                  max={4}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_base_currency}
                    onChange={(e) =>
                      setFormData({ ...formData, is_base_currency: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">Base Currency</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) =>
                      setFormData({ ...formData, is_active: e.target.checked })
                    }
                    className="w-4 h-4 rounded"
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
                {editingId ? "Update" : "Create"} Currency
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Currencies Grid */}
      {currencies.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Exchange Rate
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Base
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {currencies.map((currency) => (
                  <tr key={currency.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">{currency.code}</td>
                    <td className="px-6 py-4 text-sm">{currency.name}</td>
                    <td className="px-6 py-4 text-sm">{currency.symbol || "-"}</td>
                    <td className="px-6 py-4 text-sm text-right font-mono">
                      {currency.exchange_rate.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {currency.is_base_currency ? (
                        <Star className="h-4 w-4 text-yellow-500 inline" />
                      ) : (
                        <button
                          onClick={() => handleSetBaseCurrency(currency.id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Set as base currency"
                        >
                          <StarOff className="h-4 w-4 inline" />
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {currency.is_active ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      <button
                        onClick={() => handleEdit(currency)}
                        className="text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Currencies Found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first currency
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Currency
          </button>
        </div>
      )}
    </div>
  );
}
