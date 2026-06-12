'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetAlertsListPage() {
  return (
    <EntityList
      entityType="budget_alerts"
      title="Budget Alerts"
      newPath="/accounting/budget-alerts/new"
    />
  );
}
