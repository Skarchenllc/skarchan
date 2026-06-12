'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/pm/projects');
  };

  const handleCancel = () => {
    router.push('/pm/projects');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/pm/projects"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
        <h1 className="text-3xl font-bold text-black">New Project</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="pm_projects"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
