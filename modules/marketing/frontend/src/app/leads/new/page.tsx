"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewLeadPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/leads");
  };

  const handleCancel = () => {
    router.push("/leads");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/leads" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Leads
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Add New Lead</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="leads"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
