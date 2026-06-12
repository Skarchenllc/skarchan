'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetsListPage() {
  return (
    <EntityList
      entityType="budgets"
      title="Budgets"
      newPath="/accounting/budgets/new"
    />
  );
}
