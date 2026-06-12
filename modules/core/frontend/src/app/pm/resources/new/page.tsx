'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewResourcePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/pm/resources');
  };

  const handleCancel = () => {
    router.push('/pm/resources');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/pm/resources"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Resources
        </Link>
        <h1 className="text-3xl font-bold text-black">New Resource</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="pm_resources"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
