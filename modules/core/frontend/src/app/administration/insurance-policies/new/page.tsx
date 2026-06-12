'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewInsurancePolicyPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New Insurance Policies</h1>
      <DynamicEntityForm
        entityType="insurance_policies"
        onSave={() => router.push('/administration/insurance-policies')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
