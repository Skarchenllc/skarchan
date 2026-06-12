'use client';

import EntityList from '@shared/components/EntityList';

export default function PrototypesListPage() {
  return (
    <EntityList
      entityType="prototypes"
      title="Prototypes"
      newPath="/rd/prototypes/new"
    />
  );
}
