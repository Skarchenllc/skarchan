'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewContractPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Contract</h1>
      <DynamicEntityForm
        entityType="contracts"
        onSave={() => router.push('/administration/contracts')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
