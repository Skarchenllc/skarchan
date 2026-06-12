'use client';

import EntityList from '@shared/components/EntityList';

export default function BackgroundChecksListPage() {
  return (
    <EntityList
      entityType="background_checks"
      title="Background Checks"
      newPath="/hr/background-checks/new"
    />
  );
}
