"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import { X, Upload, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/context/accounting/toast-context";
import Image from "next/image";

interface Transaction {
  id?: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  debit_account_id: string;
  credit_account_id: string;
  status: string;
  notes?: string;
  attachments?: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
}

interface AttachmentFile {
  filename: string;
  original_filename: string;
  url: string;
  size: number;
  content_type: string;
}

interface TransactionFormProps {
  transaction?: Transaction | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function TransactionFormEnhanced({ transaction, onClose, onSuccess }: TransactionFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<Transaction>({
    date: new Date().toISOString().split("T")[0],
    reference: "",
    description: "",
    amount: 0,
    debit_account_id: "",
    credit_account_id: "",
    status: "posted",
    notes: "",
    attachments: "[]",
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentFile[]>([]);

  useEffect(() => {
    loadAccounts();
    if (transaction) {
      setFormData({
        ...transaction,
        date: transaction.date.split("T")[0],
      });
      // Parse existing attachments
      if (transaction.attachments) {
        try {
          const parsed = JSON.parse(transaction.attachments);
          setUploadedFiles(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          setUploadedFiles([]);
        }
      }
    }
    // Don't auto-generate reference on load - let backend do it or user can click Generate button
  }, [transaction]);

  const loadAccounts = async () => {
    try {
      setLoadingAccounts(true);
      const response = await apiClient.get("/accounts");
      // Ensure we're setting an array
      const accountsData = Array.isArray(response.data) ? response.data : [];
      setAccounts(accountsData);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      setAccounts([]); // Set empty array on error
      toast.error("Failed to load accounts");
    } finally {
      setLoadingAccounts(false);
    }
  };

  const generateReference = async () => {
    try {
      const response = await apiClient.get("/transactions/generate-reference", {
        params: { date: formData.date }
      });
      setFormData((prev) => ({ ...prev, reference: response.data.reference }));
    } catch (error) {
      console.error("Failed to generate reference:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedFilesList: AttachmentFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post("/uploads", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        uploadedFilesList.push(response.data);
      }

      setUploadedFiles([...uploadedFiles, ...uploadedFilesList]);
      toast.success(`${uploadedFilesList.length} file(s) uploaded successfully!`);
    } catch (error: any) {
      console.error("Failed to upload files:", error);
      toast.error(error.response?.data?.detail || "Failed to upload files");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveFile = (filename: string) => {
    setUploadedFiles(uploadedFiles.filter((f) => f.filename !== filename));
    toast.success("File removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate required fields
    if (!formData.debit_account_id) {
      setError("Please select a debit account");
      setLoading(false);
      toast.error("Please select a debit account");
      return;
    }

    if (!formData.credit_account_id) {
      setError("Please select a credit account");
      setLoading(false);
      toast.error("Please select a credit account");
      return;
    }

    if (!formData.description) {
      setError("Please enter a description");
      setLoading(false);
      toast.error("Please enter a description");
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      setLoading(false);
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    try {
      // Transform formData to match backend expectations
      const payload = {
        date: formData.date,
        reference: formData.reference || null,  // Send null if empty for auto-generation
        description: formData.description,
        amount: formData.amount,
        debit_account_id: formData.debit_account_id,
        credit_account_id: formData.credit_account_id,
        status: formData.status,
        notes: formData.notes || null,
        attachments: JSON.stringify(uploadedFiles),
      };

      if (transaction?.id) {
        await apiClient.put(`/transactions/${transaction.id}`, payload);
        toast.success("Transaction updated successfully!");
      } else {
        await apiClient.post("/transactions", payload);
        toast.success("Transaction created successfully!");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      // Handle validation errors (array of objects) or string errors
      let errorMessage = "Failed to save transaction";
      const detail = err.response?.data?.detail;

      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // Pydantic validation errors - format them nicely
        errorMessage = detail.map((e: any) => {
          const field = e.loc?.join(".") || "field";
          return `${field}: ${e.msg}`;
        }).join(", ");
      } else if (detail && typeof detail === "object") {
        errorMessage = JSON.stringify(detail);
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold">
            {transaction ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && typeof error === "string" && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Date *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Reference <span className="text-muted-foreground font-normal">(Optional - Auto-generated if empty)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Leave empty to auto-generate"
                />
                {!transaction?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const response = await apiClient.get("/transactions/generate-reference", {
                          params: { date: formData.date }
                        });
                        setFormData({ ...formData, reference: response.data.reference });
                      } catch (error) {
                        console.error("Failed to generate reference:", error);
                      }
                    }}
                    className="px-4 py-2 border rounded-md hover:bg-accent whitespace-nowrap"
                  >
                    Generate
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter transaction description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              required
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Debit Account *
              </label>
              <select
                value={formData.debit_account_id}
                onChange={(e) => setFormData({ ...formData, debit_account_id: e.target.value })}
                required
                disabled={loadingAccounts}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingAccounts ? "Loading accounts..." : accounts.length === 0 ? "No accounts available" : "Select account"}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Credit Account *
              </label>
              <select
                value={formData.credit_account_id}
                onChange={(e) => setFormData({ ...formData, credit_account_id: e.target.value })}
                required
                disabled={loadingAccounts}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingAccounts ? "Loading accounts..." : accounts.length === 0 ? "No accounts available" : "Select account"}
                </option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Additional notes (optional)"
            />
          </div>

          {/* File Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-medium mb-2">
              Attachments (Receipts/Invoices)
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading..." : "Upload Files"}
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              <span className="text-sm text-muted-foreground">
                Supports: Images (JPG, PNG, GIF) & PDF (Max 10MB each)
              </span>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 border rounded-md bg-muted/30"
                  >
                    {file.content_type?.startsWith("image/") ? (
                      <div className="relative w-12 h-12 flex-shrink-0">
                        <Image
                          src={`/api/proxy-image?path=${encodeURIComponent(file.url)}`}
                          alt={file.original_filename}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.original_filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.filename)}
                      className="p-1 hover:bg-destructive/10 rounded"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-muted/50 p-4 rounded-md">
            <h3 className="text-sm font-semibold mb-2">Transaction Summary</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debit:</span>
                <span className="font-medium">
                  {accounts.find((a) => a.id === formData.debit_account_id)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credit:</span>
                <span className="font-medium">
                  {accounts.find((a) => a.id === formData.credit_account_id)?.name || "-"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-bold">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(formData.amount || 0)}
                </span>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attachments:</span>
                  <span className="font-medium">{uploadedFiles.length} file(s)</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploading || loadingAccounts || accounts.length === 0}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : loadingAccounts ? "Loading..." : accounts.length === 0 ? "No Accounts Available" : transaction ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
