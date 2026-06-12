'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewSLAAgreementPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/sla-agreements');
  };

  const handleCancel = () => {
    router.push('/sla-agreements');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/sla-agreements"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to SLA Agreements
        </Link>
        <h1 className="text-3xl font-bold text-black">New SLA Agreement</h1>
        <p className="text-gray-600 mt-1">Create a new SLA agreement</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="sla_agreements"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
