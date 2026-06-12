'use client';

import EntityList from '@shared/components/EntityList';

export default function SalaryBandsListPage() {
  return (
    <EntityList
      entityType="salary_bands"
      title="Salary Bands"
      newPath="/hr/salary-bands/new"
    />
  );
}
