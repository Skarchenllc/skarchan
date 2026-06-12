'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function TimeOffListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="time_off"
        title="Time Off"
        newPath="/time-off/new"
      />
    </>
  );
}
