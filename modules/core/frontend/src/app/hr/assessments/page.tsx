'use client';

import EntityList from '@shared/components/EntityList';

export default function AssessmentsListPage() {
  return (
    <EntityList
      entityType="assessments"
      title="Assessments"
      newPath="/hr/assessments/new"
    />
  );
}
