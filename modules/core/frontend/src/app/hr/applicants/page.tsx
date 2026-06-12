'use client';

import EntityList from '@shared/components/EntityList';

export default function ApplicantsListPage() {
  return (
    <EntityList
      entityType="applicants"
      title="Applicants"
      newPath="/hr/applicants/new"
    />
  );
}
