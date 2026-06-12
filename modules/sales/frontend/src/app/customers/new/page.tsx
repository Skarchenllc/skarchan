"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewCustomerPage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    // Navigate back to customers list after successful save
    router.push("/customers");
  };

  const handleCancel = () => {
    router.push("/customers");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/customers" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Customers
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create New Customer</h2>
          </div>

          {/* Dynamic Form - Reads fields from database */}
          <DynamicEntityForm
            entityType="customers"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
