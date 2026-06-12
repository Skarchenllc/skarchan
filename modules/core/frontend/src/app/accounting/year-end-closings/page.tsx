'use client';

import EntityList from '@shared/components/EntityList';

export default function YearEndClosingsListPage() {
  return (
    <EntityList
      entityType="year_end_closings"
      title="Year End Closings"
      newPath="/accounting/year-end-closings/new"
    />
  );
}
