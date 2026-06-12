"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface ExchangeRate {
  id: string;
  from_currency_code: string;
  to_currency_code: string;
  rate: number;
  inverse_rate: number;
  effective_date: string;
  source: string | null;
  created_at: string;
  created_by: string | null;
}

interface Currency {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [fetchingLive, setFetchingLive] = useState(false);
  const { showToast} = useToast();

  const [formData, setFormData] = useState({
    from_currency_code: "",
    to_currency_code: "",
    rate: 1.0,
    effective_date: new Date().toISOString().split("T")[0],
    source: "Manual",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ratesRes, currenciesRes] = await Promise.all([
        apiClient.get("/currency/exchange-rates?limit=100"),
        apiClient.get("/currency/currencies?is_active=true"),
      ]);

      setRates(ratesRes.data);
      setCurrencies(currenciesRes.data);
    } catch (error) {
      showToast("Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.from_currency_code === formData.to_currency_code) {
      showToast("From and To currencies must be different", "error");
      return;
    }

    try {
      await apiClient.post("/currency/exchange-rates", formData);
      showToast("Exchange rate created successfully", "success");
      resetForm();
      loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to create exchange rate",
        "error"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      from_currency_code: "",
      to_currency_code: "",
      rate: 1.0,
      effective_date: new Date().toISOString().split("T")[0],
      source: "Manual",
    });
    setShowForm(false);
  };

  const fetchLiveRates = async () => {
    try {
      setFetchingLive(true);

      // Get base currency from currencies list
      const baseCurrency = currencies.find((c) => c.code === "USD") || currencies[0];

      if (!baseCurrency) {
        showToast("No currencies found. Please add currencies first.", "error");
        return;
      }

      // Fetch and save live rates
      const response = await apiClient.post(
        `/currency/fetch-and-save-rates/${baseCurrency.code}`
      );

      showToast(
        `Successfully fetched ${response.data.saved_rates} live exchange rates`,
        "success"
      );

      // Reload rates
      loadData();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to fetch live rates",
        "error"
      );
    } finally {
      setFetchingLive(false);
    }
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
          <h2 className="text-3xl font-bold tracking-tight">Exchange Rates</h2>
          <p className="text-muted-foreground">
            Manage currency exchange rates and conversions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchLiveRates}
            disabled={fetchingLive}
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary/10 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${fetchingLive ? 'animate-spin' : ''}`} />
            {fetchingLive ? 'Fetching...' : 'Fetch Live Rates'}
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Exchange Rate
          </button>
        </div>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Rates</span>
            <span className="text-xl font-bold text-gray-900">{rates.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Currency Pairs</span>
            <span className="text-xl font-bold text-gray-900">
              {new Set(rates.map((r) => `${r.from_currency_code}/${r.to_currency_code}`)).size}
            </span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Latest Update</span>
            <span className="text-xl font-bold text-gray-900">
              {rates.length > 0 ? formatDate(rates[0].effective_date) : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Add Exchange Rate</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  From Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.from_currency_code}
                  onChange={(e) =>
                    setFormData({ ...formData, from_currency_code: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  To Currency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.to_currency_code}
                  onChange={(e) =>
                    setFormData({ ...formData, to_currency_code: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Select currency</option>
                  {currencies.map((currency) => (
                    <option key={currency.id} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Exchange Rate <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      rate: parseFloat(e.target.value) || 1.0,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="1.0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Effective Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.effective_date}
                  onChange={(e) =>
                    setFormData({ ...formData, effective_date: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) =>
                    setFormData({ ...formData, source: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Manual, API, Bank, etc."
                />
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
                Create Exchange Rate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Exchange Rates Table */}
      {rates.length > 0 ? (
        <div className="rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Currency Pair
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Inverse Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Effective Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 text-sm font-medium">
                      {rate.from_currency_code} / {rate.to_currency_code}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-mono">
                      {rate.rate.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-mono text-muted-foreground">
                      {rate.inverse_rate.toFixed(6)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {formatDate(rate.effective_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{rate.source || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Exchange Rates Found</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first exchange rate
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Add Exchange Rate
          </button>
        </div>
      )}
    </div>
  );
}
