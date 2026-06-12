'use client';

import EntityList from '@shared/components/EntityList';

export default function EmployeesListPage() {
  return (
    <EntityList
      entityType="employees"
      title="Employees"
      newPath="/hr/employees/new"
    />
  );
}
