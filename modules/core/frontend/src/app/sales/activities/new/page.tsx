'use client';

import { useRouter } from 'next/navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function NewActivityPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Log New Activity</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicEntityForm
            entityType="activities"
            onSave={() => router.push('/sales/activities')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
