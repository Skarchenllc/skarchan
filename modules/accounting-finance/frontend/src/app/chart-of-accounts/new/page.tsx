"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Navigation } from "@/components/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewChartOfAccountsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/chart-of-accounts");
  };

  const handleCancel = () => {
    router.push("/chart-of-accounts");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/chart-of-accounts" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chart of Accounts
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Chart of Accounts</h2>
          </div>

          <DynamicEntityForm
            entityType="chart_of_accounts"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
