'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewLicensePage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Licenses & Permits</h1>
      <DynamicEntityForm
        entityType="licenses"
        onSave={() => router.push('/administration/licenses')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
