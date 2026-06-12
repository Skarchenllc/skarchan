"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import Navigation from "@/components/hr/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewJobRequisitionPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/hr/job-requisitions" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Job Requisitions
          </Link>
        </div>
        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <FileText className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Create Job Requisition</h2>
          </div>
          <DynamicEntityForm entityType="job_requisitions" onSave={() => router.push("/hr/job-requisitions")} onCancel={() => router.push("/hr/job-requisitions")} />
        </div>
      </main>
    </div>
  );
}
