"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewWebsiteAnalyticsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/website-analytics");
  };

  const handleCancel = () => {
    router.push("/website-analytics");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/website-analytics" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Website Analytics
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Add Website Analytics Data</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="website_analytics"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
