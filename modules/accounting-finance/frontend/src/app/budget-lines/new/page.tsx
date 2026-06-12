"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Navigation } from "@/components/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewBudgetLinesPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/budget-lines");
  };

  const handleCancel = () => {
    router.push("/budget-lines");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/budget-lines" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Budget Line
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Budget Line</h2>
          </div>

          <DynamicEntityForm
            entityType="budget_lines"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
