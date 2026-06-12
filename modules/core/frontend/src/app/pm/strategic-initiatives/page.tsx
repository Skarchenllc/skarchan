'use client';

import EntityList from '@shared/components/EntityList';

export default function StrategicInitiativesListPage() {
  return (
    <EntityList
      entityType="strategic_initiatives"
      title="Strategic Initiatives"
      newPath="/pm/strategic-initiatives/new"
    />
  );
}
