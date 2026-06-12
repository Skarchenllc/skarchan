'use client';

import EntityList from '@shared/components/EntityList';

export default function ResourcesListPage() {
  return (
    <EntityList
      entityType="pm_resources"
      title="Resources"
      newPath="/pm/resources/new"
    />
  );
}
