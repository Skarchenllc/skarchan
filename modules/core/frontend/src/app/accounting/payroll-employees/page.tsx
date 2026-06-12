'use client';

import EntityList from '@shared/components/EntityList';

export default function PayrollEmployeesListPage() {
  return (
    <EntityList
      entityType="payroll_employees"
      title="Payroll Employees"
      newPath="/accounting/payroll-employees/new"
    />
  );
}
