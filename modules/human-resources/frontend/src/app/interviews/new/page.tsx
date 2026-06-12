"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Navigation from "@/components/Navigation";
import DynamicEntityForm from "@shared/components/DynamicEntityForm";

export default function NewInterviewPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link href="/interviews" className="inline-flex items-center text-gray-600 hover:text-black">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Interviews
          </Link>
        </div>
        <div className="border border-gray-200 rounded-lg p-8">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-black">Schedule Interview</h2>
          </div>
          <DynamicEntityForm entityType="interviews" onSave={() => router.push("/interviews")} onCancel={() => router.push("/interviews")} />
        </div>
      </main>
    </div>
  );
}
