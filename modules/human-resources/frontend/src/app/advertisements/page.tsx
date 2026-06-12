'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function AdvertisementsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="advertisements"
        title="Advertisements"
        newPath="/advertisements/new"
      />
    </>
  );
}
