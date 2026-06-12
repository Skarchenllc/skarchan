'use client';

import EntityList from '@shared/components/EntityList';

export default function BudgetTemplatesListPage() {
  return (
    <EntityList
      entityType="budget_templates"
      title="Budget Templates"
      newPath="/accounting/budget-templates/new"
    />
  );
}
