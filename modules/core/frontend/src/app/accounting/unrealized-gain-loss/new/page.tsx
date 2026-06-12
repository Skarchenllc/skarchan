"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Activity } from "lucide-react";
import { Navigation } from "@/components/accounting/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewUnrealizedGainLossPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/accounting/unrealized-gain-loss");
  };

  const handleCancel = () => {
    router.push("/accounting/unrealized-gain-loss");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/accounting/unrealized-gain-loss" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Unrealized FX Gain/Loss
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Activity className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Unrealized FX Gain/Loss</h2>
          </div>

          <DynamicEntityForm
            entityType="unrealized_gain_loss"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
