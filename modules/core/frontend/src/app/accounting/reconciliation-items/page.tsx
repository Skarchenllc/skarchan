'use client';

import EntityList from '@shared/components/EntityList';

export default function ReconciliationItemsListPage() {
  return (
    <EntityList
      entityType="reconciliation_items"
      title="Reconciliation Items"
      newPath="/accounting/reconciliation-items/new"
    />
  );
}
