'use client';

import EntityList from '@shared/components/EntityList';

export default function PayrollJournalsListPage() {
  return (
    <EntityList
      entityType="payroll_journals"
      title="Payroll Journals"
      newPath="/accounting/payroll-journals/new"
    />
  );
}
