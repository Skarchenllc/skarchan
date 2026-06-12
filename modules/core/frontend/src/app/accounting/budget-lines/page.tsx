'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetLinesListPage() {
  return (
    <EntityList
      entityType="budget_lines"
      title="Budget Lines"
      newPath="/accounting/budget-lines/new"
    />
  );
}
