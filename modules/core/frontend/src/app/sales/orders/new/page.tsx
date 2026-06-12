"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Navigation from "@/components/sales/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewOrderPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/sales/orders");
  };

  const handleCancel = () => {
    router.push("/sales/orders");
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/sales/orders" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <ShoppingCart className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create New Order</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="orders"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
