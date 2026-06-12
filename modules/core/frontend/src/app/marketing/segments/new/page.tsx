'use client';

import { useRouter } from 'next/navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function NewSegmentPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Segment</h1>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicEntityForm
            entityType="segments"
            onSave={() => router.push('/marketing/segments')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
