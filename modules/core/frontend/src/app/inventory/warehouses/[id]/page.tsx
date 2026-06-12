'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const handleSave = () => {
    router.push('/inventory/warehouses');
  };

  const handleCancel = () => {
    router.push('/inventory/warehouses');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/inventory/warehouses"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Warehouses
        </Link>
        <h1 className="text-3xl font-bold text-black">Edit Warehouse</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="warehouses"
          entityId={id}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
