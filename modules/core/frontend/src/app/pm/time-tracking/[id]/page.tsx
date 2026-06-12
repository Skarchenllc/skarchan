'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function EditTimeTrackingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const handleSave = () => {
    router.push('/pm/time-tracking');
  };

  const handleCancel = () => {
    router.push('/pm/time-tracking');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/pm/time-tracking"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Time Tracking
        </Link>
        <h1 className="text-3xl font-bold text-black">Edit Time Entry</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="time_tracking"
          entityId={id}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
