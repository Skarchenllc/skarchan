'use client';

import EntityList from '@shared/components/EntityList';

export default function NonConformancesListPage() {
  return (
    <EntityList
      entityType="qms_nonconformances"
      title="Non-Conformances"
      newPath="/qms/nonconformances/new"
    />
  );
}
