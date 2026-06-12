"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Search, Calendar, Filter, Download, BookOpen, Eye, TrendingUp, TrendingDown } from "lucide-react";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  reference: string;
  description: string;
  type: string;
  amount: number;
  debit_account_id: string;
  credit_account_id: string;
  status: string;
  notes?: string;
  attachments?: string;
  created_at: string;
  updated_at: string;
}

export default function JournalPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);
      if (statusFilter) params.append("status", statusFilter);

      const [transactionsRes, accountsRes] = await Promise.all([
        apiClient.get(`/transactions?${params.toString()}`),
        apiClient.get("/accounts"),
      ]);

      setTransactions(transactionsRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      console.error("Failed to load journal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find((a) => a.id === accountId);
    return account ? `${account.code} - ${account.name}` : "Unknown Account";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAccountName(transaction.debit_account_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getAccountName(transaction.credit_account_id).toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const totalDebits = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCredits = filteredTransactions.reduce((sum, t) => sum + t.amount, 0);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 print:mb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">General Journal</h1>
            <p className="text-muted-foreground">
              Chronological record of all accounting transactions
            </p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 print:hidden"
        >
          <Download className="h-4 w-4" />
          Print Journal
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 print:hidden">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Start Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            placeholder="Start Date"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            placeholder="End Date"
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="posted">Posted</option>
            <option value="reconciled">Reconciled</option>
            <option value="void">Void</option>
          </select>
        </div>
      </div>

      {/* Compact Statistics Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Entries</span>
            <span className="text-xl font-bold text-gray-900">{filteredTransactions.length}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Debits</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalDebits)}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Total Credits</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(totalCredits)}</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-900" />
            <span className="text-sm text-gray-600">Balance</span>
            <span className="text-xl font-bold text-gray-900">
              {Math.abs(totalDebits - totalCredits) < 0.01 ? 'Balanced ✓' : formatCurrency(totalDebits - totalCredits)}
            </span>
          </div>
        </div>
      </div>

      {/* Journal Entries Table */}
      <div className="bg-card rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-semibold">Date</th>
                <th className="text-left p-4 font-semibold">Reference</th>
                <th className="text-left p-4 font-semibold">Account</th>
                <th className="text-left p-4 font-semibold">Description</th>
                <th className="text-right p-4 font-semibold">Debit</th>
                <th className="text-right p-4 font-semibold">Credit</th>
                <th className="text-center p-4 font-semibold">Status</th>
                <th className="text-center p-4 font-semibold print:hidden">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    No journal entries found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction, index) => (
                  <>
                    {/* Debit Entry */}
                    <tr
                      key={`${transaction.id}-debit`}
                      className={`border-t hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="p-4 font-mono text-sm">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="p-4 font-mono text-sm">{transaction.reference}</td>
                      <td className="p-4">
                        <span className="font-medium">
                          {getAccountName(transaction.debit_account_id)}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{transaction.description}</td>
                      <td className="p-4 text-right font-mono text-red-600 font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="p-4 text-right font-mono">-</td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-4 text-center print:hidden" rowSpan={2}>
                        <button
                          onClick={() => setSelectedTransaction(transaction)}
                          className="p-2 hover:bg-accent rounded-md"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>

                    {/* Credit Entry */}
                    <tr
                      key={`${transaction.id}-credit`}
                      className={`border-b hover:bg-muted/50 transition-colors ${
                        index % 2 === 0 ? '' : 'bg-muted/20'
                      }`}
                    >
                      <td className="p-4"></td>
                      <td className="p-4"></td>
                      <td className="p-4 pl-8">
                        <span className="font-medium text-muted-foreground">
                          {getAccountName(transaction.credit_account_id)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground italic">
                        {transaction.notes || ""}
                      </td>
                      <td className="p-4 text-right font-mono">-</td>
                      <td className="p-4 text-right font-mono text-green-600 font-medium">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="p-4"></td>
                    </tr>
                  </>
                ))
              )}
            </tbody>

            {/* Totals Footer */}
            {filteredTransactions.length > 0 && (
              <tfoot className="bg-primary/5 border-t-2 border-primary">
                <tr className="font-bold">
                  <td colSpan={4} className="p-4 text-lg">
                    TOTALS
                  </td>
                  <td className="p-4 text-right font-mono text-lg text-red-600">
                    {formatCurrency(totalDebits)}
                  </td>
                  <td className="p-4 text-right font-mono text-lg text-green-600">
                    {formatCurrency(totalCredits)}
                  </td>
                  <td colSpan={2} className="p-4 text-center">
                    {Math.abs(totalDebits - totalCredits) < 0.01 ? (
                      <span className="text-green-600">✓ Balanced</span>
                    ) : (
                      <span className="text-red-600">⚠ Out of Balance</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-muted/30 border rounded-lg p-6 print:hidden">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          About the General Journal
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          The General Journal is a chronological record of all financial transactions in your
          business. Each transaction is recorded using double-entry bookkeeping, showing both
          the debit and credit sides of every entry.
        </p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-semibold">Debit (Dr.):</span>
            <p className="text-muted-foreground">
              Increases in assets and expenses, decreases in liabilities and equity
            </p>
          </div>
          <div>
            <span className="font-semibold">Credit (Cr.):</span>
            <p className="text-muted-foreground">
              Increases in liabilities, equity, and revenue, decreases in assets
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}
