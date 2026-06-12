"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";
import { Plus, Edit, Trash2, Search, TrendingUp, X } from "lucide-react";

interface ExchangeRate {
  id: string;
  [key: string]: any; // Dynamic fields from database
}

export default function ExchangeRatesPage() {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [filteredRates, setFilteredRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadExchangeRates();
  }, []);

  useEffect(() => {
    filterRates();
  }, [exchangeRates, searchTerm]);

  const loadExchangeRates = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/currency/exchange-rates");
      setExchangeRates(response.data);
    } catch (error) {
      console.error("Failed to load exchange rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterRates = () => {
    let filtered = exchangeRates;

    if (searchTerm) {
      filtered = filtered.filter(
        (rate) =>
          (rate.from_currency || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (rate.to_currency || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRates(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exchange rate?")) return;

    try {
      await apiClient.delete(`/currency/exchange-rates/${id}`);
      loadExchangeRates();
    } catch (error) {
      console.error("Failed to delete exchange rate:", error);
    }
  };

  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setShowForm(true);
  };

  const handleFormClose = async (savedRecord?: any) => {
    setShowForm(false);
    setEditingRate(null);
    await loadExchangeRates();
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
          <h2 className="text-3xl font-bold tracking-tight">Exchange Rates</h2>
          <p className="text-muted-foreground">
            Manage currency exchange rates and conversion settings
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Exchange Rate
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Exchange Rates</span>
            <span className="text-xl font-bold text-gray-900">{exchangeRates.length}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exchange rates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Exchange Rates Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  From Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  To Currency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Rate Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Exchange Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredRates.map((rate) => (
                <tr key={rate.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {rate.from_currency || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {rate.to_currency || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {rate.rate_date ? new Date(rate.rate_date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono">
                    {rate.exchange_rate ? Number(rate.exchange_rate).toFixed(6) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="text-primary hover:text-primary/80"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(rate.id)}
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

        {filteredRates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No exchange rates found</p>
          </div>
        )}
      </div>

      {/* Exchange Rate Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                {editingRate ? "Edit Exchange Rate" : "New Exchange Rate"}
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
                entityType="exchange_rates"
                recordId={editingRate?.id}
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
