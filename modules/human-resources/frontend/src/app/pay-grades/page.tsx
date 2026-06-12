'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function PayGradesListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="pay_grades"
        title="Pay Grades"
        newPath="/pay-grades/new"
      />
    </>
  );
}
