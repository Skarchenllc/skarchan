"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Navigation } from "@/components/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewAccountingPeriodsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/accounting-periods");
  };

  const handleCancel = () => {
    router.push("/accounting-periods");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/accounting-periods" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Accounting Period
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Accounting Period</h2>
          </div>

          <DynamicEntityForm
            entityType="accounting_periods"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
