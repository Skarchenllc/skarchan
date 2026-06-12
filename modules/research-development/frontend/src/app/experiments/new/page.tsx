'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewExperimentPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/experiments');
  };

  const handleCancel = () => {
    router.push('/experiments');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/experiments"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Experiments
        </Link>
        <h1 className="text-3xl font-bold text-black">New Experiment</h1>
        <p className="text-gray-600 mt-1">Create a new research experiment</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="experiments"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
