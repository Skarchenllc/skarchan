'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function EmployeeBenefitsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="employee_benefits"
        title="Employee Benefits"
        newPath="/employee-benefits/new"
      />
    </>
  );
}
