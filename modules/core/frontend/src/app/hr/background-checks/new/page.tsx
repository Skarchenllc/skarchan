"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import Navigation from "@/components/hr/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewBackgroundCheckPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/hr/background-checks");
  };

  const handleCancel = () => {
    router.push("/hr/background-checks");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/hr/background-checks" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Background Checks
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Background Check</h2>
          </div>

          <DynamicEntityForm
            entityType="background_checks"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
