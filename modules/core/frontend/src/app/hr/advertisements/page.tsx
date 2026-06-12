'use client';

import EntityList from '@shared/components/EntityList';

export default function AdvertisementsListPage() {
  return (
    <EntityList
      entityType="advertisements"
      title="Advertisements"
      newPath="/hr/advertisements/new"
    />
  );
}
