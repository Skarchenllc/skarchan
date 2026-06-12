'use client';

import EntityList from '@shared/components/EntityList';

export default function PayrollListPage() {
  return (
    <EntityList
      entityType="payroll"
      title="Payroll"
      newPath="/hr/payroll/new"
    />
  );
}
