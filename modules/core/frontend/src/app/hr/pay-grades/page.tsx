'use client';

import EntityList from '@shared/components/EntityList';

export default function PayGradesListPage() {
  return (
    <EntityList
      entityType="pay_grades"
      title="Pay Grades"
      newPath="/hr/pay-grades/new"
    />
  );
}
