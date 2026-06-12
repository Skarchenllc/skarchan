'use client';

import EntityList from '@shared/components/EntityList';

export default function PeriodClosingsListPage() {
  return (
    <EntityList
      entityType="period_closings"
      title="Period Closings"
      newPath="/accounting/period-closings/new"
    />
  );
}
