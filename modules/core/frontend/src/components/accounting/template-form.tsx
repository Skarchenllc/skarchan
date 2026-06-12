"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { TransactionTemplate } from "@/lib/accounting/transaction-templates";
import { apiClient } from "@/lib/accounting/api-client";
import { useToast } from "@/context/accounting/toast-context";

interface Account {
  id: string;
  code: string;
  name: string;
  category: string;
  type: string;
}

interface TemplateFormProps {
  template: TransactionTemplate;
  onBack: () => void;
  onSuccess: () => void;
}

export function TemplateForm({ template, onBack, onSuccess }: TemplateFormProps) {
  const toast = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({
    date: new Date().toISOString().split("T")[0],
  });
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await apiClient.get("/accounts");
      // Ensure we're setting an array
      const accountsData = Array.isArray(response.data) ? response.data : [];
      setAccounts(accountsData);
    } catch (error) {
      console.error("Failed to load accounts:", error);
      setAccounts([]); // Set empty array on error
      toast.error("Failed to load accounts");
    }
  };

  const getFilteredAccounts = (filter?: { categories?: string[]; codes?: string[] }) => {
    if (!filter) return accounts;

    let filtered = accounts;

    if (filter.categories && filter.categories.length > 0) {
      filtered = filtered.filter((acc) =>
        filter.categories!.some((cat) => acc.category === cat)
      );
    }

    if (filter.codes && filter.codes.length > 0) {
      filtered = filtered.filter((acc) =>
        filter.codes!.some((code) => acc.code === code)
      );
    }

    return filtered;
  };

  const findAccountByCode = (code: string): Account | undefined => {
    return accounts.find((acc) => acc.code === code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Determine debit and credit accounts based on template rules
      let debitAccountId: string;
      let creditAccountId: string;

      // For expense templates (pay vendor, pay subscription, etc.)
      if (template.accountingRules.debitAccountType === "expense") {
        // Debit is the expense account (from category selection or template default)
        if (formData.category) {
          const expenseAccount = findAccountByCode(formData.category);
          debitAccountId = expenseAccount?.id || "";
        } else if (formData.service_type) {
          const expenseAccount = findAccountByCode(formData.service_type);
          debitAccountId = expenseAccount?.id || "";
        } else {
          // Default to first expense account matching template (codes starting with 5 or 6)
          const expenseAccounts = accounts.filter((acc) => acc.type === "expense");
          debitAccountId = expenseAccounts[0]?.id || "";
        }

        // Credit is the payment account (bank/cash)
        creditAccountId = formData.payment_account;
      }
      // For revenue templates (receive payment)
      else if (template.accountingRules.debitAccountType === "asset" &&
               template.accountingRules.creditAccountType === "revenue") {
        // Debit is the bank account (receiving money)
        debitAccountId = formData.received_in;

        // Credit is the revenue account
        if (formData.revenue_type) {
          const revenueAccount = findAccountByCode(formData.revenue_type);
          creditAccountId = revenueAccount?.id || "";
        } else {
          const revenueAccounts = accounts.filter((acc) => acc.code.startsWith("4"));
          creditAccountId = revenueAccounts[0]?.id || "";
        }
      }
      // Default fallback
      else {
        throw new Error("Invalid template configuration");
      }

      // Validate that we have valid account IDs
      if (!debitAccountId || debitAccountId === "") {
        throw new Error("Please select a valid debit account. The selected account could not be found.");
      }

      if (!creditAccountId || creditAccountId === "") {
        throw new Error("Please select a valid credit account. The selected account could not be found.");
      }

      // Build description from template data
      let description = "";
      if (template.id === "pay-saas" || template.id === "pay-cloud") {
        description = `Paid ${formData.vendor || "vendor"} for ${template.name}`;
      } else if (template.id === "receive-payment") {
        description = `Received payment from ${formData.customer || "customer"}`;
      } else if (template.id === "pay-contractor") {
        description = `Paid ${formData.contractor || "contractor"} for services`;
      } else if (template.id === "pay-salary") {
        description = `Paid salary to ${formData.employee || "employee"}`;
      }

      // Add custom description if provided
      if (formData.description) {
        description += ` - ${formData.description}`;
      }

      // Create transaction
      const payload = {
        date: formData.date,
        reference: null,  // Let backend auto-generate
        description,
        amount: parseFloat(formData.amount),
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        status: "posted",
        notes: formData.description || null,
        attachments: "[]",
      };

      await apiClient.post("/transactions", payload);
      toast.success("Transaction created successfully!");
      onSuccess();
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
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case "text":
        return (
          <input
            type="text"
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );

      case "number":
        return (
          <input
            type="number"
            step="0.01"
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        );

      case "select":
        return (
          <select
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case "account":
        const filteredAccounts = getFilteredAccounts(field.accountFilter);
        return (
          <select
            value={formData[field.id] || ""}
            onChange={(e) => handleFieldChange(field.id, e.target.value)}
            required={field.required}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select account</option>
            {filteredAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 hover:bg-accent rounded"
              title="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{template.icon}</span>
                {template.name}
              </h2>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && typeof error === "string" && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}

          {template.fields.map((field) => (
            <div key={field.id}>
              <label className="block text-sm font-medium mb-2">
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </label>
              {renderField(field)}
              {field.helperText && (
                <p className="text-xs text-muted-foreground mt-1">{field.helperText}</p>
              )}
            </div>
          ))}

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm">
            <p className="font-medium text-blue-900 mb-1">✨ Automatic Accounting</p>
            <p className="text-blue-700">
              Don't worry about debit and credit accounts - this template automatically assigns
              them based on the transaction type.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border rounded-md hover:bg-accent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
