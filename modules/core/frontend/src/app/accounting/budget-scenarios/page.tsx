'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetScenariosListPage() {
  return (
    <EntityList
      entityType="budget_scenarios"
      title="Budget Scenarios"
      newPath="/accounting/budget-scenarios/new"
    />
  );
}
