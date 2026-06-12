"use client";

import { X, FileText, Download, Calendar, DollarSign, Hash, FileCheck } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface AttachmentFile {
  filename: string;
  original_filename: string;
  url: string;
  size: number;
  content_type: string;
}

interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  debit_account_id: string;
  credit_account_id: string;
  status: string;
  notes?: string;
  attachments?: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

interface TransactionDetailModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const [debitAccount, setDebitAccount] = useState<Account | null>(null);
  const [creditAccount, setCreditAccount] = useState<Account | null>(null);
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
    parseAttachments();
  }, [transaction]);

  const loadAccounts = async () => {
    try {
      const [debitRes, creditRes] = await Promise.all([
        apiClient.get(`/accounts/${transaction.debit_account_id}`),
        apiClient.get(`/accounts/${transaction.credit_account_id}`),
      ]);
      setDebitAccount(debitRes.data);
      setCreditAccount(creditRes.data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const parseAttachments = () => {
    if (transaction.attachments) {
      try {
        const parsed = JSON.parse(transaction.attachments);
        setAttachments(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setAttachments([]);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "posted":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reconciled":
        return "bg-blue-100 text-blue-800";
      case "void":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Transaction Details</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {transaction.reference}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  transaction.status
                )}`}
              >
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </span>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Date</p>
                    <p className="font-semibold">{formatDate(transaction.date)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Reference</p>
                    <p className="font-semibold">{transaction.reference}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatAmount(transaction.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{transaction.description}</p>
                </div>

                {transaction.notes && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm text-muted-foreground">{transaction.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Accounting Entries */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                Double-Entry Accounting
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-3 rounded border-l-4 border-l-red-500">
                  <p className="text-xs font-medium text-muted-foreground mb-1">DEBIT</p>
                  {loading ? (
                    <p className="text-sm">Loading...</p>
                  ) : (
                    <>
                      <p className="font-semibold">{debitAccount?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {debitAccount?.code} - {debitAccount?.type}
                      </p>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {formatAmount(transaction.amount)}
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-card p-3 rounded border-l-4 border-l-green-500">
                  <p className="text-xs font-medium text-muted-foreground mb-1">CREDIT</p>
                  {loading ? (
                    <p className="text-sm">Loading...</p>
                  ) : (
                    <>
                      <p className="font-semibold">{creditAccount?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {creditAccount?.code} - {creditAccount?.type}
                      </p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {formatAmount(transaction.amount)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Attachments Section */}
            {attachments.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Attachments ({attachments.length})
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      {file.content_type?.startsWith("image/") ? (
                        <div
                          className="relative h-32 bg-muted cursor-pointer"
                          onClick={() => setSelectedImage(`/api/proxy-image?path=${encodeURIComponent(file.url)}`)}
                        >
                          <Image
                            src={`/api/proxy-image?path=${encodeURIComponent(file.url)}`}
                            alt={file.original_filename}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 bg-muted flex items-center justify-center">
                          <FileText className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="p-2 bg-card">
                        <p className="text-xs font-medium truncate">
                          {file.original_filename}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                        <a
                          href={`/api/proxy-image?path=${encodeURIComponent(file.url)}`}
                          download={file.original_filename}
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
              <p>Created: {formatDate(transaction.created_at)}</p>
              <p>Last Updated: {formatDate(transaction.updated_at)}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full h-full p-8">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300"
            >
              <X className="h-8 w-8" />
            </button>
            <div className="relative w-full h-full">
              <Image
                src={selectedImage}
                alt="Full size"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
