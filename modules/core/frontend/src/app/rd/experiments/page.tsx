'use client';

import EntityList from '@shared/components/EntityList';

export default function ExperimentsListPage() {
  return (
    <EntityList
      entityType="experiments"
      title="Experiments"
      newPath="/rd/experiments/new"
    />
  );
}
