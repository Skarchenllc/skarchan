"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { Navigation } from "@/components/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewTransactionsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/transactions");
  };

  const handleCancel = () => {
    router.push("/transactions");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/transactions" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to GL Transaction
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create GL Transaction</h2>
          </div>

          <DynamicEntityForm
            entityType="transactions"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
