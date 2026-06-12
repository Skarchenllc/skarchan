'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2 } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { fetchApi } from '@/lib/api';
import { WorkOrder } from '@/lib/types';

export default function WorkOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadWorkOrder();
  }, [params.id]);

  const loadWorkOrder = async () => {
    try {
      const data = await fetchApi<WorkOrder>(`/work-orders/${params.id}`);
      setWorkOrder(data);
      setNewStatus(data.status);
    } catch (error) {
      console.error('Failed to load work order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!workOrder || newStatus === workOrder.status) return;

    setUpdating(true);
    try {
      await fetchApi(`/work-orders/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      loadWorkOrder();
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

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

  if (!workOrder) {
    return <div>Work order not found</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/work-orders" className="text-blue-600 hover:text-blue-700 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Work Orders
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">{workOrder.order_number}</h1>
            <p className="text-gray-600 mt-2">
              {workOrder.product?.name || `Product #${workOrder.product_id}`}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 card">
          <h2 className="text-xl font-bold text-black mb-6">Work Order Details</h2>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Order Number</label>
              <p className="text-black font-medium">{workOrder.order_number}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Product</label>
              <p className="text-black">{workOrder.product?.name || `Product #${workOrder.product_id}`}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
              <p className="text-black">{workOrder.quantity} {workOrder.unit_of_measure}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Priority</label>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityColor(workOrder.priority)}`}>
                {workOrder.priority}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(workOrder.status)}`}>
                {workOrder.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Production Line</label>
              <p className="text-black">{workOrder.production_line_id || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Scheduled Start</label>
              <p className="text-black">
                {workOrder.scheduled_start ? new Date(workOrder.scheduled_start).toLocaleString() : '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Scheduled End</label>
              <p className="text-black">
                {workOrder.scheduled_end ? new Date(workOrder.scheduled_end).toLocaleString() : '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Actual Start</label>
              <p className="text-black">
                {workOrder.actual_start ? new Date(workOrder.actual_start).toLocaleString() : '-'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Actual End</label>
              <p className="text-black">
                {workOrder.actual_end ? new Date(workOrder.actual_end).toLocaleString() : '-'}
              </p>
            </div>

            {workOrder.notes && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">Notes</label>
                <p className="text-black">{workOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Status Update Panel */}
        <div className="card">
          <h2 className="text-xl font-bold text-black mb-6">Update Status</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={handleStatusUpdate}
              disabled={updating || newStatus === workOrder.status}
              className="btn-primary w-full"
            >
              {updating ? 'Updating...' : 'Update Status'}
            </button>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-black mb-2">Timeline</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="text-black">{new Date(workOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <p className="text-black">{new Date(workOrder.updated_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
