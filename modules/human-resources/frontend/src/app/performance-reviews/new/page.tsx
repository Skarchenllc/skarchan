"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewPerformanceReviewPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/performance-reviews");
  };

  const handleCancel = () => {
    router.push("/performance-reviews");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/performance-reviews" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Performance Reviews
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Star className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Performance Review</h2>
          </div>

          <DynamicEntityForm
            entityType="performance_reviews"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
