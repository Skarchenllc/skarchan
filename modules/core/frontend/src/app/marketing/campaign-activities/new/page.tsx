"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
import Navigation from "@/components/marketing/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewCampaignActivityPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/marketing/campaign-activities");
  };

  const handleCancel = () => {
    router.push("/marketing/campaign-activities");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/marketing/campaign-activities" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaign Activities
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Add New Campaign Activity</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="campaign_activities"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
