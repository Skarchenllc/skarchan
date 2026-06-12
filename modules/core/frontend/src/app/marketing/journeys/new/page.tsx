'use client';

import { useRouter } from 'next/navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function NewJourneyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Journey</h1>
          <p className="text-sm text-gray-500 mt-1">
            <strong>Steps (JSON)</strong> is an ordered list, e.g.&nbsp;
            <code className="text-xs bg-gray-100 px-1">
              [{'{'}"delay_days":0,"action":"send_email","value":"Welcome"{'}'},{'{'}"delay_days":2,"action":"create_activity","value":"Sales follow-up"{'}'}]
            </code>
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicEntityForm
            entityType="journeys"
            onSave={() => router.push('/marketing/journeys')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
