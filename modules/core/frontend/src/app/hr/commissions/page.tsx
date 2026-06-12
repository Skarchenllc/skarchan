'use client';

import EntityList from '@shared/components/EntityList';

export default function CommissionsListPage() {
  return (
    <EntityList
      entityType="commissions"
      title="Commissions"
      newPath="/hr/commissions/new"
    />
  );
}
