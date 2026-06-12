'use client';

import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import Navigation from '@/components/hr/Navigation';
import DynamicEntityForm from '@shared/components/DynamicEntityForm';

export default function PerformanceReviewsEditPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/hr/performance-reviews" className="inline-flex items-center text-gray-600 hover:text-black">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Performance Reviews
            </Link>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Performance Review</h1>
            <DynamicEntityForm
              entityType="performance_reviews"
              entityId={id}
              onSave={() => router.push('/hr/performance-reviews')}
              onCancel={() => router.push('/hr/performance-reviews')}
            />
          </div>
        </div>
      </div>
    </>
  );
}
