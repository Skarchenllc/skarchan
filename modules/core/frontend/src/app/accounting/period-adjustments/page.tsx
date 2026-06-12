'use client';

import EntityList from '@shared/components/EntityList';

export default function PeriodAdjustmentsListPage() {
  return (
    <EntityList
      entityType="period_adjustments"
      title="Period Adjustments"
      newPath="/accounting/period-adjustments/new"
    />
  );
}
