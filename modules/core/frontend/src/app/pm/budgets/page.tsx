'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetsListPage() {
  return (
    <EntityList
      entityType="pm_budgets"
      title="Budgets"
      newPath="/pm/budgets/new"
    />
  );
}
