'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { WorkOrder } from '@/lib/types';

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    loadWorkOrders();
  }, []);

  const loadWorkOrders = async () => {
    try {
      const data = await fetchApi<{work_orders: WorkOrder[]}>('/work-orders');
      setWorkOrders(data.work_orders || []);
    } catch (error) {
      console.error('Failed to load work orders:', error);
      setWorkOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkOrders = workOrders.filter((wo) => {
    const matchesStatus = !statusFilter || wo.status === statusFilter;
    const matchesPriority = !priorityFilter || wo.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 text-green-700';
      case 'in_progress': return 'bg-blue-50 text-blue-700';
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 text-red-700';
      case 'high': return 'bg-orange-50 text-orange-700';
      case 'medium': return 'bg-yellow-50 text-yellow-700';
      case 'low': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold text-black">Work Orders</h1>
        </div>
        <Link href="/work-orders/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          New Work Order
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="card">
        {filteredWorkOrders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No work orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-black">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Product</th>
                  <th className="text-right py-3 px-4 font-semibold text-black">Quantity</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Status</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-black">Scheduled Start</th>
                  <th className="text-center py-3 px-4 font-semibold text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkOrders.map((wo) => (
                  <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-black font-medium">{wo.work_order_number}</td>
                    <td className="py-3 px-4 text-black">
                      {wo.product_name || `Product #${wo.product_id}`}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {wo.quantity_planned}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(wo.status)}`}>
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(wo.priority)}`}>
                        {wo.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {wo.scheduled_start_date ? new Date(wo.scheduled_start_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/work-orders/${wo.id}`}
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
