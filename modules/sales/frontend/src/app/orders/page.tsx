"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, Plus, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  order_date: string;
  expected_delivery_date: string | null;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const apiUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/orders` : '/api/orders';
      const res = await fetch(apiUrl);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "text-gray-600 bg-gray-100";
      case "pending": return "text-blue-600 bg-blue-50";
      case "processing": return "text-blue-600 bg-blue-100";
      case "shipped": return "text-blue-700 bg-blue-200";
      case "delivered": return "text-blue-600 bg-blue-50";
      case "cancelled": return "text-gray-500 bg-gray-50";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "text-blue-600 bg-blue-50";
      case "pending": return "text-gray-600 bg-gray-100";
      case "partial": return "text-blue-600 bg-blue-100";
      case "refunded": return "text-gray-500 bg-gray-50";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold text-black">Orders</h1>
          </div>
          <Link
            href="/orders/new"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </Link>
        </div>

        {/* Bulk Actions */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">{selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Export CSV</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Print Invoice</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Mark Shipped</button>
              <button className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50">Change Status</button>
              <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders..."
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
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading orders...</div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12 border border-gray-200 rounded-lg">
            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">No orders found</h3>
            <p className="text-gray-600 mb-4">Start creating orders for your customers</p>
            <Link
              href="/orders/new"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Order</span>
            </Link>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left w-12">
                    <input type="checkbox" className="rounded border-gray-300"
                      checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredOrders.map(o => o.id)) : new Set())} />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase w-16">S.#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Expected Delivery</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order, index) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-gray-300"
                        checked={selectedIds.has(order.id)}
                        onChange={(e) => {
                          const newSet = new Set(selectedIds);
                          e.target.checked ? newSet.add(order.id) : newSet.delete(order.id);
                          setSelectedIds(newSet);
                        }} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <Link href={`/orders/${order.id}`} className="hover:text-blue-600">
                        <div className="font-semibold text-black">{order.order_number}</div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.customer_name || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {order.expected_delivery_date ? new Date(order.expected_delivery_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-black font-semibold">
                      ${order.total_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPaymentStatusColor(order.payment_status)}`}>
                        {order.payment_status}
                      </span>
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
