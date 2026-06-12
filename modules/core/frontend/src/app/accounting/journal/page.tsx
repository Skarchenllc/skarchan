'use client';

import EntityList from '@shared/components/EntityList';

export default function JournalListPage() {
  return (
    <EntityList
      entityType="transactions"
      title="Journal"
      newPath="/accounting/journal/new"
    />
  );
}
