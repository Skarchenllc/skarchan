'use client';

import EntityList from '@shared/components/EntityList';

export default function TransactionsListPage() {
  return (
    <EntityList
      entityType="transactions"
      title="Transactions"
      newPath="/accounting/transactions/new"
    />
  );
}
