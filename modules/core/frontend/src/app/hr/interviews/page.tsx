'use client';

import EntityList from '@shared/components/EntityList';

export default function InterviewsListPage() {
  return (
    <EntityList
      entityType="interviews"
      title="Interviews"
      newPath="/hr/interviews/new"
    />
  );
}
