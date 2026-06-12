'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetRevisionsListPage() {
  return (
    <EntityList
      entityType="budget_revisions"
      title="Budget Revisions"
      newPath="/accounting/budget-revisions/new"
    />
  );
}
