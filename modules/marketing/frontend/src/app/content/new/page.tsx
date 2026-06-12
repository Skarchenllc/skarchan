"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewContentPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/content");
  };

  const handleCancel = () => {
    router.push("/content");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/content" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Content
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create New Content</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="contents"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
