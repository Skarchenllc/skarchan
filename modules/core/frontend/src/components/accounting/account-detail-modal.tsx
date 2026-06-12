"use client";

import { X, TrendingUp, TrendingDown, Calendar, Hash, Tag, DollarSign } from "lucide-react";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  balance: number;
  currency: string;
  is_active: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface AccountDetailModalProps {
  account: Account;
  onClose: () => void;
}

export function AccountDetailModal({ account, onClose }: AccountDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: account.currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "asset":
        return "bg-blue-100 text-blue-800";
      case "liability":
        return "bg-red-100 text-red-800";
      case "equity":
        return "bg-purple-100 text-purple-800";
      case "revenue":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getAccountNature = (type: string) => {
    switch (type.toLowerCase()) {
      case "asset":
        return {
          nature: "Debit",
          increases: "Debits increase this account",
          decreases: "Credits decrease this account",
        };
      case "expense":
        return {
          nature: "Debit",
          increases: "Debits increase this account",
          decreases: "Credits decrease this account",
        };
      case "liability":
        return {
          nature: "Credit",
          increases: "Credits increase this account",
          decreases: "Debits decrease this account",
        };
      case "equity":
        return {
          nature: "Credit",
          increases: "Credits increase this account",
          decreases: "Debits decrease this account",
        };
      case "revenue":
        return {
          nature: "Credit",
          increases: "Credits increase this account",
          decreases: "Debits decrease this account",
        };
      default:
        return {
          nature: "Unknown",
          increases: "",
          decreases: "",
        };
    }
  };

  const accountNature = getAccountNature(account.type);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-card rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">Account Details</h2>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status and Type Badges */}
            <div className="flex items-center gap-3">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(
                  account.type
                )}`}
              >
                {account.type.toUpperCase()}
              </span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  account.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {account.is_active ? "Active" : "Inactive"}
              </span>
              <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
                {accountNature.nature} Balance
              </span>
            </div>

            {/* Main Details Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Account Code</p>
                    <p className="font-semibold font-mono text-lg">{account.code}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Account Name</p>
                    <p className="font-semibold">{account.name}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="font-semibold">{account.category}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(account.balance)}
                      </p>
                      {account.balance >= 0 ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground">Currency</p>
                    <p className="font-semibold font-mono">{account.currency}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {account.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{account.description}</p>
              </div>
            )}

            {/* Account Nature Information */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-3">Account Nature & Behavior</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary font-semibold min-w-[80px]">Nature:</span>
                  <span className="text-muted-foreground">
                    This is a <strong>{accountNature.nature}</strong> balance account
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-semibold min-w-[80px]">Increases:</span>
                  <span className="text-muted-foreground">{accountNature.increases}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-red-600 font-semibold min-w-[80px]">Decreases:</span>
                  <span className="text-muted-foreground">{accountNature.decreases}</span>
                </div>
              </div>
            </div>

            {/* Financial Statement Category */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-sm font-semibold mb-2">Financial Statement</h3>
              <p className="text-sm text-muted-foreground">
                {["asset", "liability", "equity"].includes(account.type.toLowerCase()) ? (
                  <>
                    This account appears on the <strong>Balance Sheet</strong> under{" "}
                    <strong>{account.type}</strong> section.
                  </>
                ) : (
                  <>
                    This account appears on the <strong>Income Statement (P&L)</strong> as{" "}
                    <strong>{account.type}</strong>.
                  </>
                )}
              </p>
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground border-t pt-4 space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Created: {formatDate(account.created_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                <span>Last Updated: {formatDate(account.updated_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-3 w-3" />
                <span>Account ID: {account.id}</span>
              </div>
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
    </>
  );
}
