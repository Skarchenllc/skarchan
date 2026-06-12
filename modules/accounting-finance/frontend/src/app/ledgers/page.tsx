"use client";

import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";
import { Search, Calendar, Download, BookOpen, TrendingUp, TrendingDown, Eye } from "lucide-react";
import { TransactionDetailModal } from "@/components/transaction-detail-modal";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  category: string;
  balance: number;
  is_active: boolean;
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

interface LedgerEntry {
  date: string;
  reference: string;
  description: string;
  transaction: Transaction;
  debit: number;
  credit: number;
  balance: number;
  counterAccount: string;
}

export default function LedgersPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountTypeFilter, setAccountTypeFilter] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [accountTypeFilter]);

  useEffect(() => {
    if (selectedAccount) {
      loadLedgerEntries();
    }
  }, [selectedAccount, startDate, endDate]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/accounts");
      let accountsList = response.data.filter((a: Account) => a.is_active);

      if (accountTypeFilter) {
        accountsList = accountsList.filter((a: Account) => a.type === accountTypeFilter);
      }

      setAccounts(accountsList);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadLedgerEntries = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await apiClient.get(`/transactions?${params.toString()}`);
      const allTransactions = response.data;

      // Filter transactions related to the selected account
      const relatedTransactions = allTransactions.filter(
        (t: Transaction) =>
          t.debit_account_id === selectedAccount.id ||
          t.credit_account_id === selectedAccount.id
      );

      setTransactions(relatedTransactions);

      // Calculate ledger entries with running balance
      let runningBalance = 0;
      const entries: LedgerEntry[] = [];

      // Sort by date
      const sortedTransactions = [...relatedTransactions].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      sortedTransactions.forEach((transaction) => {
        const isDebit = transaction.debit_account_id === selectedAccount.id;
        const debit = isDebit ? transaction.amount : 0;
        const credit = !isDebit ? transaction.amount : 0;

        // Update running balance based on account type
        if (["ASSET", "EXPENSE"].includes(selectedAccount.type.toUpperCase())) {
          runningBalance += debit - credit;
        } else {
          runningBalance += credit - debit;
        }

        // Get counter account
        const counterAccountId = isDebit
          ? transaction.credit_account_id
          : transaction.debit_account_id;
        const counterAccount = accounts.find((a) => a.id === counterAccountId);

        entries.push({
          date: transaction.date,
          reference: transaction.reference,
          description: transaction.description,
          transaction,
          debit,
          credit,
          balance: runningBalance,
          counterAccount: counterAccount
            ? `${counterAccount.code} - ${counterAccount.name}`
            : "Unknown",
        });
      });

      setLedgerEntries(entries);
    } catch (error) {
      console.error("Failed to load ledger entries:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredAccounts = accounts.filter((account) =>
    `${account.code} ${account.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const totalDebits = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredits = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
  const finalBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">General Ledger</h1>
            <p className="text-muted-foreground">
              View transaction history and running balances for each account
            </p>
          </div>
        </div>
        {selectedAccount && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 print:hidden"
          >
            <Download className="h-4 w-4" />
            Print Ledger
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Account Selection */}
        <div className="lg:col-span-1 print:hidden">
          <div className="bg-card border rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Select Account</h2>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Account Type Filter */}
            <select
              value={accountTypeFilter}
              onChange={(e) => setAccountTypeFilter(e.target.value)}
              className="w-full mb-4 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">All Account Types</option>
              <option value="ASSET">Assets</option>
              <option value="LIABILITY">Liabilities</option>
              <option value="EQUITY">Equity</option>
              <option value="REVENUE">Revenue</option>
              <option value="EXPENSE">Expenses</option>
            </select>

            {/* Accounts List */}
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    selectedAccount?.id === account.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm font-medium">
                      {account.code}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      selectedAccount?.id === account.id
                        ? "bg-primary-foreground/20"
                        : "bg-muted"
                    }`}>
                      {account.type}
                    </span>
                  </div>
                  <div className="font-semibold mb-1">{account.name}</div>
                  <div className="text-sm opacity-90">
                    Balance: {formatCurrency(account.balance)}
                  </div>
                </button>
              ))}

              {filteredAccounts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No accounts found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Ledger Entries */}
        <div className="lg:col-span-2">
          {!selectedAccount ? (
            <div className="bg-card border rounded-lg p-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Select an Account</h3>
              <p className="text-muted-foreground">
                Choose an account from the left panel to view its ledger entries
              </p>
            </div>
          ) : (
            <>
              {/* Account Header */}
              <div className="bg-card border rounded-lg p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono px-3 py-1 bg-muted rounded">
                        {selectedAccount.code}
                      </span>
                      <span className="text-sm px-3 py-1 bg-primary/10 text-primary rounded">
                        {selectedAccount.type}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold mb-1">
                      {selectedAccount.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {selectedAccount.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">
                      Current Balance
                    </div>
                    <div className="text-3xl font-bold flex items-center gap-2">
                      {selectedAccount.balance >= 0 ? (
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      ) : (
                        <TrendingDown className="h-6 w-6 text-red-500" />
                      )}
                      {formatCurrency(selectedAccount.balance)}
                    </div>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Compact Statistics Bar */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 print:hidden">
                <div className="flex flex-wrap items-center gap-6">
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
                    <span className="text-sm text-gray-600">Net Change</span>
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(totalDebits - totalCredits)}</span>
                  </div>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div className="bg-card border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4 font-semibold">Date</th>
                        <th className="text-left p-4 font-semibold">Reference</th>
                        <th className="text-left p-4 font-semibold">Description</th>
                        <th className="text-left p-4 font-semibold">Counter Account</th>
                        <th className="text-right p-4 font-semibold">Debit</th>
                        <th className="text-right p-4 font-semibold">Credit</th>
                        <th className="text-right p-4 font-semibold">Balance</th>
                        <th className="text-center p-4 font-semibold print:hidden">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          </td>
                        </tr>
                      ) : ledgerEntries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-8 text-center text-muted-foreground"
                          >
                            No transactions found for this account
                          </td>
                        </tr>
                      ) : (
                        ledgerEntries.map((entry, index) => (
                          <tr
                            key={index}
                            className="border-t hover:bg-muted/50 transition-colors"
                          >
                            <td className="p-4 font-mono text-sm">
                              {formatDate(entry.date)}
                            </td>
                            <td className="p-4 font-mono text-sm">
                              {entry.reference}
                            </td>
                            <td className="p-4 text-sm">{entry.description}</td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {entry.counterAccount}
                            </td>
                            <td className="p-4 text-right font-mono text-red-600">
                              {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                            </td>
                            <td className="p-4 text-right font-mono text-green-600">
                              {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                            </td>
                            <td className="p-4 text-right font-mono font-bold">
                              {formatCurrency(entry.balance)}
                            </td>
                            <td className="p-4 text-center print:hidden">
                              <button
                                onClick={() => setSelectedTransaction(entry.transaction)}
                                className="p-2 hover:bg-accent rounded-md"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* Totals Footer */}
                    {ledgerEntries.length > 0 && (
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
                          <td className="p-4 text-right font-mono text-lg">
                            {formatCurrency(finalBalance)}
                          </td>
                          <td className="print:hidden"></td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-muted/30 border rounded-lg p-6 print:hidden">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          About General Ledger
        </h3>
        <p className="text-sm text-muted-foreground">
          The General Ledger shows the complete transaction history for each account with
          a running balance. This helps you track how each account's balance changes over
          time and identify all transactions affecting a specific account.
        </p>
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
