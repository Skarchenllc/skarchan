'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/hr/Navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function PayGradesEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/hr/pay-grades" className="inline-flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Pay Grades
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Pay Grade</h1>
            <DynamicEntityForm
              entityType="pay_grades"
              entityId={id}
              onSave={() => router.push('/hr/pay-grades')}
              onCancel={() => router.push('/hr/pay-grades')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
