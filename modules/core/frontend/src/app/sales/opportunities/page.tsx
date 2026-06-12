'use client';

import EntityList from '@shared/components/EntityList';

export default function OpportunitiesListPage() {
  return (
    <EntityList
      entityType="opportunities"
      title="Opportunities"
      newPath="/sales/opportunities/new"
    />
  );
}
