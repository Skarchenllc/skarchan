'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function PositionsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="positions"
        title="Positions"
        newPath="/positions/new"
      />
    </>
  );
}
