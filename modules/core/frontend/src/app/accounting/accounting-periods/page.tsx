'use client';

import EntityList from '@shared/components/EntityList';

export default function AccountingPeriodsListPage() {
  return (
    <EntityList
      entityType="accounting_periods"
      title="Accounting Periods"
      newPath="/accounting/accounting-periods/new"
    />
  );
}
