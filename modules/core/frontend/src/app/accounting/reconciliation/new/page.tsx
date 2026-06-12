"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/accounting/api-client";
import { useRouter } from "next/navigation";
import { Upload, ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_type: string;
}

export default function NewReconciliationPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    bank_account_id: "",
    statement_date: "",
    opening_balance: "",
    closing_balance: "",
    csv_file: null as File | null,
  });

  useEffect(() => {
    loadBankAccounts();
  }, []);

  const loadBankAccounts = async () => {
    try {
      const response = await apiClient.get("/bank-reconciliation/bank-accounts", {
        params: { is_active: true },
      });
      setBankAccounts(response.data);
    } catch (error) {
      console.error("Failed to load bank accounts:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, csv_file: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.csv_file) {
      alert("Please upload a CSV file");
      return;
    }

    setLoading(true);

    try {
      // Read CSV file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;
        const base64Content = btoa(csvContent);

        const importRequest = {
          bank_account_id: formData.bank_account_id,
          statement_date: formData.statement_date,
          opening_balance: parseFloat(formData.opening_balance),
          closing_balance: parseFloat(formData.closing_balance),
          csv_data: base64Content,
          date_format: "%Y-%m-%d",
          column_mapping: {
            date: "Date",
            description: "Description",
            debit: "Debit",
            credit: "Credit",
            balance: "Balance",
            reference: "Reference",
          },
        };

        try {
          const response = await apiClient.post(
            "/bank-reconciliation/statements/import-csv",
            importRequest
          );

          alert(`Statement imported successfully!\n${response.data.message}`);

          // Create reconciliation
          const reconResponse = await apiClient.post("/bank-reconciliation/reconciliations", {
            bank_account_id: formData.bank_account_id,
            statement_date: formData.statement_date,
            statement_balance: parseFloat(formData.closing_balance),
            book_balance: 0, // Will be calculated
          });

          router.push(`/accounting/reconciliation/${reconResponse.data.id}`);
        } catch (error: any) {
          alert(`Failed to import statement: ${error.response?.data?.detail || error.message}`);
        } finally {
          setLoading(false);
        }
      };

      reader.readAsText(formData.csv_file);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/accounting/reconciliation"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Reconciliations
        </Link>
      </div>

      <div>
        <h2 className="text-3xl font-bold tracking-tight">New Bank Reconciliation</h2>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4 py-8 pt-24">
        {[1, 2, 3].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                step >= stepNumber
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step > stepNumber ? <CheckCircle className="h-5 w-5" /> : stepNumber}
            </div>
            {stepNumber < 3 && (
              <div
                className={`h-0.5 w-20 ${
                  step > stepNumber ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-card p-6 space-y-6">
          {/* Step 1: Select Bank Account */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Select Bank Account</h3>
            <div>
              <label className="block text-sm font-medium mb-2">
                Bank Account <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bank_account_id}
                onChange={(e) => {
                  setFormData({ ...formData, bank_account_id: e.target.value });
                  if (e.target.value) setStep(2);
                }}
                required
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                <option value="">Select a bank account...</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bank_name} - {account.account_number} ({account.account_type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Statement Details */}
          {step >= 2 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">2. Statement Details</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Statement Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.statement_date}
                    onChange={(e) => setFormData({ ...formData, statement_date: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Opening Balance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.opening_balance}
                    onChange={(e) => setFormData({ ...formData, opening_balance: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Closing Balance <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.closing_balance}
                    onChange={(e) => {
                      setFormData({ ...formData, closing_balance: e.target.value });
                      if (e.target.value) setStep(3);
                    }}
                    required
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Upload Statement */}
          {step >= 3 && (
            <div className="space-y-4 pt-6 border-t">
              <h3 className="text-lg font-semibold">3. Upload Bank Statement (CSV)</h3>
              <div>
                <label className="block text-sm font-medium mb-2">
                  CSV File <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    required
                    className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {formData.csv_file && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Selected: {formData.csv_file.name}
                    </p>
                  )}
                </div>

                <div className="mt-4 p-4 bg-muted rounded-md text-sm">
                  <p className="font-semibold mb-2">CSV Format Requirements:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Columns: Date, Description, Debit, Credit, Balance, Reference</li>
                    <li>Date format: YYYY-MM-DD (e.g., 2024-01-15)</li>
                    <li>Amounts should be numeric (no currency symbols)</li>
                    <li>First row should contain column headers</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            href="/accounting/reconciliation"
            className="px-4 py-2 border rounded-md hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading || !formData.csv_file}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Importing..." : "Import & Create Reconciliation"}
          </button>
        </div>
      </form>
    </div>
  );
}
