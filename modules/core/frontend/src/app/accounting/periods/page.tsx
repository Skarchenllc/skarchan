'use client';

import EntityList from '@shared/components/EntityList';

export default function PeriodsListPage() {
  return (
    <EntityList
      entityType="periods"
      title="Periods"
      newPath="/accounting/periods/new"
    />
  );
}
