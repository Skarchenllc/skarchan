'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewPurchaseOrderPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/scm/purchase-orders');
  };

  const handleCancel = () => {
    router.push('/scm/purchase-orders');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/scm/purchase-orders"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Purchase Orders
        </Link>
        <h1 className="text-3xl font-bold text-black">New Purchase Order</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="purchase_orders"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
