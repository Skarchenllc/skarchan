'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewStorefrontPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Storefronts</h1>
      <DynamicEntityForm
        entityType="storefronts"
        onSave={() => router.push('/ecommerce/storefronts')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
