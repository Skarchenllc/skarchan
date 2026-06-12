'use client';

import EntityList from '@shared/components/EntityList';

export default function ListsListPage() {
  return (
    <EntityList
      entityType="lists"
      title="Lists"
      newPath="/marketing/lists/new"
    />
  );
}
