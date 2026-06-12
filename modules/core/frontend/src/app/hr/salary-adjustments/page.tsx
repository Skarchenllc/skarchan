'use client';

import EntityList from '@shared/components/EntityList';

export default function SalaryAdjustmentsListPage() {
  return (
    <EntityList
      entityType="salary_adjustments"
      title="Salary Adjustments"
      newPath="/hr/salary-adjustments/new"
    />
  );
}
