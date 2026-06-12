'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewOrderPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Orders</h1>
      <DynamicEntityForm
        entityType="orders"
        onSave={() => router.push('/ecommerce/orders')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
