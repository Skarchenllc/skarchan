'use client';

import EntityList from '@shared/components/EntityList';

export default function LeavesListPage() {
  return (
    <EntityList
      entityType="leaves"
      title="Leaves"
      newPath="/hr/leaves/new"
    />
  );
}
