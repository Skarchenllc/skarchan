'use client';

import EntityList from '@shared/components/EntityList';

export default function ProductionLinesListPage() {
  return (
    <EntityList
      entityType="production_lines"
      title="Production Lines"
      newPath="/production/production-lines/new"
    />
  );
}
