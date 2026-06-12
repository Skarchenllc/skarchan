'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { api } from '@/lib/api';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  const loadPurchaseOrders = async () => {
    try {
      const data = await api.purchase_orders.list();
      const ordersArray = Array.isArray(data) ? data : (data.purchase_orders || data.data || []);
      setPurchaseOrders(ordersArray);
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      setPurchaseOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = purchaseOrders.filter((order) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (order.po_number && order.po_number.toLowerCase().includes(search)) ||
      (order.status && order.status.toLowerCase().includes(search))
    );
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Purchase Orders</h1>
        </div>
        <Link href="/purchase-orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Purchase Order
        </Link>
      </div>

      {/* Search Filter */}
      <div className="card mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search purchase orders by PO number or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="card">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No purchase orders found</p>
            <Link href="/purchase-orders/new" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Purchase Order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">PO Number</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Order Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Expected Delivery</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Grand Total</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Payment Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{order.po_number}</td>
                    <td className="py-3 px-4 text-gray-600">{order.order_date}</td>
                    <td className="py-3 px-4 text-gray-600">{order.expected_delivery_date || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center capitalize">{order.priority || '-'}</td>
                    <td className="py-3 px-4 text-right">${order.grand_total?.toFixed(2) || '0.00'}</td>
                    <td className="py-3 px-4 capitalize">{order.payment_status || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/purchase-orders/${order.id}`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
