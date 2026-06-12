"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import Navigation from "@/components/hr/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewEmployeeBenefitPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/hr/employee-benefits" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Employee Benefits
          </Link>
        </div>
        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Enroll Employee in Benefits</h2>
          </div>
          <DynamicEntityForm entityType="employee_benefits" onSave={() => router.push("/hr/employee-benefits")} onCancel={() => router.push("/hr/employee-benefits")} />
        </div>
      </main>
    </div>
  );
}
