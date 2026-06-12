'use client';

import EntityList from '@shared/components/EntityList';

export default function ReconciliationListPage() {
  return (
    <EntityList
      entityType="bank_reconciliations"
      title="Reconciliation"
      newPath="/accounting/reconciliation/new"
    />
  );
}
