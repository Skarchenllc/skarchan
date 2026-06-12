'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewTimeTrackingPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/time-tracking');
  };

  const handleCancel = () => {
    router.push('/time-tracking');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/time-tracking"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Time Tracking
        </Link>
        <h1 className="text-3xl font-bold text-black">Log Time</h1>
        <p className="text-gray-600 mt-1">Create a new time entry</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="time_tracking"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
