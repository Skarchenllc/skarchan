'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function CommissionsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="commissions"
        title="Commissions"
        newPath="/commissions/new"
      />
    </>
  );
}
