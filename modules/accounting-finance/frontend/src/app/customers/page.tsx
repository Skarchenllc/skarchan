"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, Trash2, Users, Search, Mail, Phone, DollarSign } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  payment_terms: string | null;
  credit_limit: number;
  current_balance: number;
  is_active: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    customer_code: "",
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    billing_address: "",
    payment_terms: "Net 30",
    credit_limit: 0,
    is_active: true,
    notes: "",
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/ap-ar/customers");
      setCustomers(response.data);
    } catch (error) {
      showToast("Failed to load customers", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiClient.put(`/ap-ar/customers/${editingId}`, formData);
        showToast("Customer updated successfully", "success");
      } else {
        await apiClient.post("/ap-ar/customers", formData);
        showToast("Customer created successfully", "success");
      }

      resetForm();
      loadCustomers();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to save customer",
        "error"
      );
    }
  };

  const handleEdit = (customer: Customer) => {
    setFormData({
      customer_code: customer.customer_code,
      company_name: customer.company_name,
      contact_person: customer.contact_person || "",
      email: customer.email || "",
      phone: customer.phone || "",
      billing_address: "",
      payment_terms: customer.payment_terms || "Net 30",
      credit_limit: customer.credit_limit,
      is_active: customer.is_active,
      notes: "",
    });
    setEditingId(customer.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      customer_code: "",
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      billing_address: "",
      payment_terms: "Net 30",
      credit_limit: 0,
      is_active: true,
      notes: "",
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

  const filteredCustomers = customers.filter(
    (c) =>
      c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground">
            Manage your customers and clients
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
        />
      </div>

      {showForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Customer" : "Add Customer"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Customer Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.customer_code}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_code: e.target.value })
                  }
                  required
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="C001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.company_name}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Acme Corporation"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_person: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="Jane Smith"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="+1 (555) 987-6543"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Payment Terms
                </label>
                <select
                  value={formData.payment_terms}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_terms: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Net 60">Net 60</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Credit Limit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.credit_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      credit_limit: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="0.00"
                />
              </div>

              <div className="flex items-center">
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
                {editingId ? "Update" : "Create"} Customer
              </button>
            </div>
          </form>
        </div>
      )}

      {filteredCustomers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{customer.company_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {customer.customer_code}
                    </p>
                  </div>
                </div>
                {customer.is_active ? (
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
                {customer.contact_person && (
                  <p className="text-muted-foreground">
                    Contact: {customer.contact_person}
                  </p>
                )}
                {customer.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className={`font-medium ${customer.current_balance > 0 ? "text-red-600" : ""}`}>
                    {formatCurrency(customer.current_balance)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEdit(customer)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Customers Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No customers match your search"
              : "Get started by adding your first customer"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Customer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
