'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function SalaryBandsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="salary_bands"
        title="Salary Bands"
        newPath="/salary-bands/new"
      />
    </>
  );
}
