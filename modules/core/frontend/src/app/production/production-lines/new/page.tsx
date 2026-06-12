'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewProductionLinePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/production/production-lines');
  };

  const handleCancel = () => {
    router.push('/production/production-lines');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/production/production-lines"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Production Lines
        </Link>
        <h1 className="text-3xl font-bold text-black">New Production Line</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="production_lines"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
