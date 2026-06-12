'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewCollaborationPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/collaborations');
  };

  const handleCancel = () => {
    router.push('/collaborations');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/collaborations"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Collaborations
        </Link>
        <h1 className="text-3xl font-bold text-black">New Collaboration</h1>
        <p className="text-gray-600 mt-1">Create a new research collaboration</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="rd_collaborations"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
