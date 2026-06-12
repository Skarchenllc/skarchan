"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackageCheck } from "lucide-react";
import { Navigation } from "@/components/accounting/navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewPoReceiptsPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/accounting/po-receipts");
  };

  const handleCancel = () => {
    router.push("/accounting/po-receipts");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/accounting/po-receipts" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Goods Receipt
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <PackageCheck className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Goods Receipt</h2>
          </div>

          <DynamicEntityForm
            entityType="po_receipts"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
