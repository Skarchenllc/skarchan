'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function AssessmentsEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/assessments" className="inline-flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Assessments
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Assessment</h1>
            <DynamicEntityForm
              entityType="assessments"
              entityId={id}
              onSave={() => router.push('/assessments')}
              onCancel={() => router.push('/assessments')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
