'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewKnowledgeBasePage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/knowledge-base');
  };

  const handleCancel = () => {
    router.push('/knowledge-base');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/knowledge-base"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Knowledge Base
        </Link>
        <h1 className="text-3xl font-bold text-black">New Knowledge Article</h1>
        <p className="text-gray-600 mt-1">Create a new knowledge base article</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="knowledge_base"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
