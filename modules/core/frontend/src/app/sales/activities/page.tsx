'use client';

import EntityList from '@shared/components/EntityList';

export default function ActivitiesListPage() {
  return (
    <EntityList
      entityType="activities"
      title="Activities"
      newPath="/sales/activities/new"
    />
  );
}
