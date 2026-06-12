'use client';

import EntityList from '@shared/components/EntityList';

/**
 * General Ledger — a derived/read-only view of posted journal activity.
 * Entries are created by the journal/transaction workflow, not by hand,
 * so we hide Add New and Import. Filters are restricted to the ones
 * meaningful for browsing the ledger: date range (default) and Account Type.
 */
export default function LedgersListPage() {
  return (
    <EntityList
      entityType="transactions"
      title="General Ledger"
      readOnly
      filters={['account_type']}
    />
  );
}
