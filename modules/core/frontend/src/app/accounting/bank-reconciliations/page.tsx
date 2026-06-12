'use client';

import EntityList from '@shared/components/EntityList';

export default function BankReconciliationsListPage() {
  return (
    <EntityList
      entityType="bank_reconciliations"
      title="Bank Reconciliations"
      newPath="/accounting/bank-reconciliations/new"
    />
  );
}
