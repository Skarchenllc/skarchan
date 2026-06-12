'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function PayrollRunsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="payroll_runs"
        title="Payroll Runs"
        newPath="/payroll-runs/new"
      />
    </>
  );
}
