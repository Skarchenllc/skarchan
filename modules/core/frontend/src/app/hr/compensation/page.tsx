'use client';

import EntityList from '@shared/components/EntityList';

export default function CompensationListPage() {
  return (
    <EntityList
      entityType="compensation"
      title="Compensation"
      newPath="/hr/compensation/new"
    />
  );
}
