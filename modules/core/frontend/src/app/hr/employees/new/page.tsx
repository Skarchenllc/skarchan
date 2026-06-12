"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import Navigation from "@/components/hr/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewEmployeePage() {
  const router = useRouter();

  const handleSave = async (savedRecord: any) => {
    router.push("/hr/employees");
  };

  const handleCancel = () => {
    router.push("/hr/employees");
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/hr/employees" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Employees
          </Link>
        </div>

        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <Users className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Add New Employee</h2>
          </div>

          <DynamicEntityForm
            entityType="employees"
            onSave={handleSave}
            onCancel={handleCancel}
          />
        </div>
      </main>
    </div>
  );
}
