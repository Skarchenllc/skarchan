'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewLegalCasePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/legal-cases');
  };

  const handleCancel = () => {
    router.push('/legal-cases');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/legal-cases"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Legal Cases
        </Link>
        <h1 className="text-3xl font-bold text-black">New Legal Case</h1>
        <p className="text-gray-600 mt-1">Register a new legal case</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="legal_cases"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
