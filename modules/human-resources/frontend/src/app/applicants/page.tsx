'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function ApplicantsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="applicants"
        title="Applicants"
        newPath="/applicants/new"
      />
    </>
  );
}
