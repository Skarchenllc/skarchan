'use client';

import { useRouter } from 'next/navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function NewFormPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">New Capture Form</h1>
          <p className="text-sm text-gray-500 mt-1">
            Set <strong>Scoring Event</strong> (e.g. <code>Form Submitted</code>) and optionally an
            <strong> Enroll Journey</strong> so every submission scores the lead and starts a drip.
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <DynamicEntityForm
            entityType="forms"
            onSave={() => router.push('/marketing/forms')}
            onCancel={() => router.back()}
          />
        </div>
      </div>
    </div>
  );
}
