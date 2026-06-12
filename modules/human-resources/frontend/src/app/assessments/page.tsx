'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function AssessmentsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="assessments"
        title="Assessments"
        newPath="/assessments/new"
      />
    </>
  );
}
