"use client";

import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function GeneralLedgerPage() {
  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/accounting/reports"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Reports
        </Link>
      </div>

      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-6">
          <Construction className="h-12 w-12 text-primary" />
        </div>

        <h1 className="text-3xl font-bold mb-4">General Ledger</h1>

        <div className="bg-muted/30 border rounded-lg p-6 text-left">
          <h3 className="font-bold mb-3">Planned Features:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Filter by specific account or account type</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Date range selection for transactions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Running balance calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Transaction detail drill-down</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Export to PDF, Excel, and CSV</span>
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/accounting/reports"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            View Other Reports
          </Link>
        </div>
      </div>
    </div>
  );
}
