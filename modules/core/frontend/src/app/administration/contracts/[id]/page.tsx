'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useParams, useRouter } from 'next/navigation';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">Contract</h1>
      <DynamicEntityForm
        entityType="contracts"
        entityId={id}
        onSave={() => router.push('/administration/contracts')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
