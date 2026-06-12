"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Navigation } from "@/components/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewBankReconciliationsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/bank-reconciliations");
  };

  const handleCancel = () => {
    router.push("/bank-reconciliations");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/bank-reconciliations" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bank Reconciliation
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Bank Reconciliation</h2>
          </div>

          <DynamicEntityForm
            entityType="bank_reconciliations"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
