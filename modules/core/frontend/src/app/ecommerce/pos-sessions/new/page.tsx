'use client';

import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { useRouter } from 'next/navigation';

export default function NewPOSSessionPage() {
  const router = useRouter();
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold mb-4">New POS Sessions</h1>
      <DynamicEntityForm
        entityType="pos_sessions"
        onSave={() => router.push('/ecommerce/pos-sessions')}
        onCancel={() => router.back()}
      />
    </div>
  );
}
