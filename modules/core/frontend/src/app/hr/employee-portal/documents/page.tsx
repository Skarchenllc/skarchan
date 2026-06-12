"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  File,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  CheckCircle,
  Clock,
} from "lucide-react";
import Navigation from "@/components/hr/Navigation";

interface Document {
  id: string;
  name: string;
  type: string;
  category: string;
  size: string;
  uploadedAt: string;
  status: string;
  url?: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState("leave_attachment");

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    if (!employeeId) {
      router.push("/hr/employee-portal/login");
      return;
    }

    loadDocuments();
  }, [router]);

  const loadDocuments = async () => {
    try {
      // Mock documents - replace with actual API call
      const mockDocs: Document[] = [
        {
          id: "1",
          name: "Medical_Certificate_Jan2026.pdf",
          type: "application/pdf",
          category: "leave_attachment",
          size: "245 KB",
          uploadedAt: "2026-01-15T10:30:00",
          status: "approved",
        },
        {
          id: "2",
          name: "Vaccination_Certificate.pdf",
          type: "application/pdf",
          category: "health",
          size: "512 KB",
          uploadedAt: "2026-02-20T14:15:00",
          status: "approved",
        },
        {
          id: "3",
          name: "Training_Certificate_2025.pdf",
          type: "application/pdf",
          category: "certification",
          size: "1.2 MB",
          uploadedAt: "2025-12-10T09:00:00",
          status: "approved",
        },
      ];
      setDocuments(mockDocs);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // In a real implementation, upload to server
      // For now, simulate upload
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const newDoc: Document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: selectedFile.type,
        category: uploadCategory,
        size: `${(selectedFile.size / 1024).toFixed(0)} KB`,
        uploadedAt: new Date().toISOString(),
        status: "pending",
      };

      setDocuments([newDoc, ...documents]);
      setSelectedFile(null);
      setUploadCategory("leave_attachment");

      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setDocuments(documents.filter((doc) => doc.id !== docId));
    }
  };

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return <FileText className="w-8 h-8 text-red-500" />;
    if (type.includes("image")) return <Image className="w-8 h-8 text-blue-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      leave_attachment: "Leave Attachment",
      health: "Health Certificate",
      certification: "Professional Certificate",
      identification: "ID Document",
      other: "Other",
    };
    return labels[category] || category;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <span className="text-gray-400">|</span>
            <p className="text-sm text-gray-600">Upload and manage your documents</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Upload className="w-5 h-5 text-blue-600 mr-2" />
            Upload Document
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, DOC, DOCX, JPG, PNG (Max 5MB)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Category
                </label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="leave_attachment">Leave Attachment (Medical Certificate)</option>
                  <option value="health">Health Certificate</option>
                  <option value="certification">Professional Certificate</option>
                  <option value="identification">ID Document</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {selectedFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(selectedFile.type)}
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-600">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filter and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative ml-4">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="leave_attachment">Leave Attachments</option>
                <option value="health">Health Certificates</option>
                <option value="certification">Professional Certificates</option>
                <option value="identification">ID Documents</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">
              Your Documents ({filteredDocuments.length})
            </h3>
          </div>

          {filteredDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">No documents found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {getFileIcon(doc.type)}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">{doc.size}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                              doc.status
                            )}`}
                          >
                            {doc.status === "approved" && <CheckCircle className="w-3 h-3 inline mr-1" />}
                            {doc.status === "pending" && <Clock className="w-3 h-3 inline mr-1" />}
                            {doc.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getCategoryLabel(doc.category)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">Document Upload Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Medical certificates must be uploaded within 24 hours of sick leave</li>
            <li>• All documents are reviewed by HR before approval</li>
            <li>• Maximum file size: 5MB per document</li>
            <li>• Supported formats: PDF, DOC, DOCX, JPG, PNG</li>
            <li>• Ensure documents are clear and legible</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
