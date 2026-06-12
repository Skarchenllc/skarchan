'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useParams, useRouter } from 'next/navigation';

export default function RiskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Risk Register</h1>
      <DynamicEntityForm
        entityType="risks"
        entityId={id}
        onSave={() => router.push('/administration/risks')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
