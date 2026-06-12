'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewServiceRequestPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/service-requests');
  };

  const handleCancel = () => {
    router.push('/service-requests');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/service-requests"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Service Requests
        </Link>
        <h1 className="text-3xl font-bold text-black">New Service Request</h1>
        <p className="text-gray-600 mt-1">Create a new service request</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="service_requests"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
