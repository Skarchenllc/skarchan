'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useParams, useRouter } from 'next/navigation';

export default function DocumentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Document</h1>
      <DynamicEntityForm
        entityType="documents"
        entityId={id}
        onSave={() => router.push('/administration/documents')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
