"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Plus, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Customer {
  id: string;
  customer_code: string;
  company_name: string;
  customer_type: string;
  primary_email: string;
  primary_phone: string;
  primary_contact_name?: string;
  is_active: boolean;
  credit_limit?: number;
  total_lifetime_value: number;
  total_orders: number;
  industry?: string;
  assigned_sales_rep?: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/customers` : '/api/customers';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.primary_email && customer.primary_email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" ||
      (statusFilter === "active" && customer.is_active) ||
      (statusFilter === "inactive" && !customer.is_active);
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive ? "text-blue-600 bg-blue-50" : "text-gray-600 bg-gray-100";
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-black">Customers</h1>
          </div>
          <Link
            href="/customers/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Customer</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} customer{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Send Email</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Assign Rep</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Activate</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Deactivate</button>
              <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Customers List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading customers...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No customers found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first customer</p>
            <Link
              href="/customers/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Add Customer</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredCustomers.map(c => c.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Lifetime Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Sales Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(customer.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(customer.id) : newSet.delete(customer.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/customers/${customer.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{customer.company_name}</div>
                        <div className="text-sm text-gray-500">{customer.customer_code}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                      {customer.customer_type.replace("_", " ")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-black">{customer.primary_contact_name || "—"}</div>
                      <div className="text-sm text-gray-500">{customer.primary_email || "—"}</div>
                      <div className="text-sm text-gray-500">{customer.primary_phone || "—"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(customer.is_active)}`}>
                        {customer.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      ${customer.total_lifetime_value.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-black">
                      {customer.total_orders}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {customer.assigned_sales_rep || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
