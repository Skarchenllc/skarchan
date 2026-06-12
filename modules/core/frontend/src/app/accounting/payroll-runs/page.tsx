'use client';

import EntityList from '@shared/components/EntityList';

export default function PayrollRunsListPage() {
  return (
    <EntityList
      entityType="payroll_runs"
      title="Payroll Runs"
      newPath="/accounting/payroll-runs/new"
    />
  );
}
