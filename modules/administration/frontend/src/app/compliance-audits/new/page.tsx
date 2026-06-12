'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';
import { ArrowLeft } from 'lucide-react';

export default function NewComplianceAuditPage() {
  const router = useRouter();

  const handleSave = () => {
    router.push('/compliance-audits');
  };

  const handleCancel = () => {
    router.push('/compliance-audits');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link
          href="/compliance-audits"
          className="inline-flex items-center gap-2 text-primary hover:text-primary-dark text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Compliance Audits
        </Link>
        <h1 className="text-3xl font-bold text-black">New Compliance Audit</h1>
        <p className="text-gray-600 mt-1">Create a new compliance audit</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <DynamicEntityForm
          entityType="compliance_audits"
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
