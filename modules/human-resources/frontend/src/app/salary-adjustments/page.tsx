'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function SalaryAdjustmentsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="salary_adjustments"
        title="Salary Adjustments"
        newPath="/salary-adjustments/new"
      />
    </>
  );
}
