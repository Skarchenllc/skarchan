"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";
import { Plus, Edit, Trash2, Search, Wallet, CreditCard, Star, X } from "lucide-react";

interface PaymentMethod {
  id: string;
  [key: string]: any; // Dynamic fields from database
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  useEffect(() => {
    filterMethods();
  }, [paymentMethods, searchTerm]);

  const loadPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/payment-methods");
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Failed to load payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterMethods = () => {
    let filtered = paymentMethods;

    // Filter out inactive/deleted methods
    filtered = filtered.filter((method) =>
      method.is_active !== false && method.deleted_flag !== true
    );

    if (searchTerm) {
      filtered = filtered.filter(
        (method) =>
          (method.method_name || method.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (method.method_type || method.type || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredMethods(filtered);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;

    try {
      await apiClient.delete(`/payment-methods/${id}`);
      loadPaymentMethods();
    } catch (error) {
      console.error("Failed to delete payment method:", error);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setShowForm(true);
  };

  const handleFormClose = async (savedRecord?: any) => {
    setShowForm(false);
    setEditingMethod(null);
    await loadPaymentMethods();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeMethods = paymentMethods.filter((m) => m.is_active);
  const defaultMethod = paymentMethods.find((m) => m.is_default);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Payment Methods</h2>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Payment Method
        </button>
      </div>

      {/* Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Methods</span>
            <span className="text-xl font-bold text-gray-900">{paymentMethods.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Active Methods</span>
            <span className="text-xl font-bold text-gray-900">{activeMethods.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Default Method</span>
            <span className="text-xl font-bold text-gray-900">
              {defaultMethod ? (defaultMethod.method_name || defaultMethod.name) : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search payment methods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Payment Methods Table */}
      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Method Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Default
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
              {filteredMethods.map((method) => (
                <tr key={method.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {method.method_name || method.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/10 text-primary">
                      {method.method_type || method.type || "N/A"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {method.account_number || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {method.description ? (
                      method.description.length > 50
                        ? method.description.substring(0, 50) + "..."
                        : method.description
                    ) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    {method.is_default ? (
                      <Star className="h-4 w-4 text-yellow-500 inline" />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        method.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {method.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(method)}
                        className="text-primary hover:text-primary/80"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(method.id)}
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

        {filteredMethods.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No payment methods found</p>
          </div>
        )}
      </div>

      {/* Payment Method Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-black">
                {editingMethod ? "Edit Payment Method" : "New Payment Method"}
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
                entityType="payment_methods"
                recordId={editingMethod?.id}
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
