"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { Plus, Edit, Trash2, Building2, Search, Mail, Phone } from "lucide-react";
import { useToast } from "@/context/toast-context";

interface Vendor {
  id: string;
  vendor_code: string;
  company_name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  payment_terms: string | null;
  credit_limit: number;
  is_active: boolean;
  is_1099_vendor: boolean;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    vendor_code: "",
    company_name: "",
    contact_person: "",
    email: "",
    phone: "",
    website: "",
    billing_address: "",
    shipping_address: "",
    tax_id: "",
    payment_terms: "Net 30",
    credit_limit: 0,
    bank_name: "",
    bank_account: "",
    routing_number: "",
    is_active: true,
    is_1099_vendor: false,
    notes: "",
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/ap-ar/vendors");
      setVendors(response.data);
    } catch (error) {
      showToast("Failed to load vendors", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await apiClient.put(`/ap-ar/vendors/${editingId}`, formData);
        showToast("Vendor updated successfully", "success");
      } else {
        await apiClient.post("/ap-ar/vendors", formData);
        showToast("Vendor created successfully", "success");
      }

      resetForm();
      loadVendors();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to save vendor",
        "error"
      );
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setFormData({
      vendor_code: vendor.vendor_code,
      company_name: vendor.company_name,
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      website: "",
      billing_address: "",
      shipping_address: "",
      tax_id: "",
      payment_terms: vendor.payment_terms || "Net 30",
      credit_limit: vendor.credit_limit,
      bank_name: "",
      bank_account: "",
      routing_number: "",
      is_active: vendor.is_active,
      is_1099_vendor: vendor.is_1099_vendor,
      notes: "",
    });
    setEditingId(vendor.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this vendor?")) {
      return;
    }

    try {
      await apiClient.delete(`/ap-ar/vendors/${id}`);
      showToast("Vendor deactivated successfully", "success");
      loadVendors();
    } catch (error: any) {
      showToast(
        error.response?.data?.detail || "Failed to delete vendor",
        "error"
      );
    }
  };

  const resetForm = () => {
    setFormData({
      vendor_code: "",
      company_name: "",
      contact_person: "",
      email: "",
      phone: "",
      website: "",
      billing_address: "",
      shipping_address: "",
      tax_id: "",
      payment_terms: "Net 30",
      credit_limit: 0,
      bank_name: "",
      bank_account: "",
      routing_number: "",
      is_active: true,
      is_1099_vendor: false,
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vendor_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendors</h2>
          <p className="text-muted-foreground">
            Manage your suppliers and vendors
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search vendors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md bg-background"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? "Edit Vendor" : "Add Vendor"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Vendor Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.vendor_code}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor_code: e.target.value })
                  }
                  required
                  disabled={!!editingId}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="V001"
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
                  placeholder="ABC Supplies Inc."
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
                  placeholder="John Doe"
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
                  placeholder="vendor@example.com"
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
                  placeholder="+1 (555) 123-4567"
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
                  <option value="Net 90">Net 90</option>
                  <option value="COD">Cash on Delivery</option>
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

              <div>
                <label className="block text-sm font-medium mb-2">Tax ID</label>
                <input
                  type="text"
                  value={formData.tax_id}
                  onChange={(e) =>
                    setFormData({ ...formData, tax_id: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="EIN or VAT Number"
                />
              </div>

              <div className="flex items-center gap-4">
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

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_1099_vendor}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_1099_vendor: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium">1099 Vendor</span>
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
                {editingId ? "Update" : "Create"} Vendor
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vendors Grid */}
      {filteredVendors.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-lg border bg-card p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{vendor.company_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {vendor.vendor_code}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  {vendor.is_active ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                      Inactive
                    </span>
                  )}
                  {vendor.is_1099_vendor && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      1099
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {vendor.contact_person && (
                  <p className="text-muted-foreground">
                    Contact: {vendor.contact_person}
                  </p>
                )}
                {vendor.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                )}
                {vendor.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>{vendor.phone}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Payment Terms:</span>
                  <span className="font-medium">
                    {vendor.payment_terms || "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => handleEdit(vendor)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-muted"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-md hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "No vendors match your search"
              : "Get started by adding your first vendor"}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Vendor
            </button>
          )}
        </div>
      )}
    </div>
  );
}
