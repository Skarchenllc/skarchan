'use client';

import EntityList from '@shared/components/EntityList';

export default function PerformanceListPage() {
  return (
    <EntityList
      entityType="performance"
      title="Performance"
      newPath="/hr/performance/new"
    />
  );
}
