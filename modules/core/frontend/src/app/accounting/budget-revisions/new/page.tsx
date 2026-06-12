"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch } from "lucide-react";
import { Navigation } from "@/components/accounting/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewBudgetRevisionsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/accounting/budget-revisions");
  };

  const handleCancel = () => {
    router.push("/accounting/budget-revisions");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/accounting/budget-revisions" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budget Revision
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <GitBranch className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Budget Revision</h2>
          </div>

          <DynamicEntityForm
            entityType="budget_revisions"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
