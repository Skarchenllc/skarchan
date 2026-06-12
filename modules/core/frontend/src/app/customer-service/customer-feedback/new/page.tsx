'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewCustomerFeedbackPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/customer-service/customer-feedback');
  };

  const handleCancel = () => {
    router.push('/customer-service/customer-feedback');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/customer-service/customer-feedback"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Feedback
        </Link>
        <h1 className="text-3xl font-bold text-black">New Customer Feedback</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="customer_feedback"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
