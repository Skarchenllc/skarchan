'use client';

import EntityList from '@shared/components/EntityList';

export default function MilestonesListPage() {
  return (
    <EntityList
      entityType="pm_milestones"
      title="Milestones"
      newPath="/pm/milestones/new"
    />
  );
}
