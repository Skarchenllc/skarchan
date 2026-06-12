'use client';

import EntityList from '@shared/components/EntityList';

export default function JobRequisitionsListPage() {
  return (
    <EntityList
      entityType="job_requisitions"
      title="Job Requisitions"
      newPath="/hr/job-requisitions/new"
    />
  );
}
