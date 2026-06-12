'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function InterviewsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="interviews"
        title="Interviews"
        newPath="/interviews/new"
      />
    </>
  );
}
