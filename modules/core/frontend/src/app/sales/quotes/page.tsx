'use client';

import EntityList from '@shared/components/EntityList';

export default function QuotesListPage() {
  return (
    <EntityList
      entityType="quotes"
      title="Quotes"
      newPath="/sales/quotes/new"
    />
  );
}
