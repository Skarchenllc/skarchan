'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewBudgetPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/rd/budgets');
  };

  const handleCancel = () => {
    router.push('/rd/budgets');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/rd/budgets"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to R&D Budgets
        </Link>
        <h1 className="text-3xl font-bold text-black">New R&D Budget</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="rd_budgets"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
