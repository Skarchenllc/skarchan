'use client';

import EntityList from '@shared/components/EntityList';

export default function MilestonesListPage() {
  return (
    <EntityList
      entityType="milestones"
      title="Milestones"
      newPath="/rd/milestones/new"
    />
  );
}
