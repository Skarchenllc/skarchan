'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewStrategicInitiativePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/strategic-initiatives');
  };

  const handleCancel = () => {
    router.push('/strategic-initiatives');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/strategic-initiatives"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Strategic Initiatives
        </Link>
        <h1 className="text-3xl font-bold text-black">New Strategic Initiative</h1>
        <p className="text-gray-600 mt-1">Create a new strategic initiative</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="strategic_initiatives"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
