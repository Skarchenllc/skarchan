'use client';

import { useRouter } from 'next/navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function NewAutomationPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Automation Rule</h1>
          <p className="text-sm text-gray-500 mt-1">
            When a record on <strong>Trigger Entity</strong> fires the <strong>Trigger Event</strong>,
            and the <strong>Condition</strong> passes, run the <strong>Action</strong>.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicEntityForm
            entityType="automations"
            onSave={() => router.push('/nexacore/automation')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
