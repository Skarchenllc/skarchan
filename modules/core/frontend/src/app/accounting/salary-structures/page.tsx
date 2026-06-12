'use client';

import EntityList from '@shared/components/EntityList';

export default function SalaryStructuresListPage() {
  return (
    <EntityList
      entityType="salary_structures"
      title="Salary Structures"
      newPath="/accounting/salary-structures/new"
    />
  );
}
