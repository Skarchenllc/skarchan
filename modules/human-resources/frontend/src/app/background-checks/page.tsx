'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function BackgroundChecksListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="background_checks"
        title="Background Checks"
        newPath="/background-checks/new"
      />
    </>
  );
}
