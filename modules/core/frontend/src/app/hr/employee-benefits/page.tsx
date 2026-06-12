'use client';

import EntityList from '@shared/components/EntityList';

export default function EmployeeBenefitsListPage() {
  return (
    <EntityList
      entityType="employee_benefits"
      title="Employee Benefits"
      newPath="/hr/employee-benefits/new"
    />
  );
}
