'use client';

import EntityList from '@shared/components/EntityList';

export default function PositionsListPage() {
  return (
    <EntityList
      entityType="positions"
      title="Positions"
      newPath="/hr/positions/new"
    />
  );
}
