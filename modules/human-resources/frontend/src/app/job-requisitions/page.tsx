'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function JobRequisitionsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="job_requisitions"
        title="Job Requisitions"
        newPath="/job-requisitions/new"
      />
    </>
  );
}
