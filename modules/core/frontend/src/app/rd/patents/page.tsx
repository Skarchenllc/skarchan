'use client';

import EntityList from '@shared/components/EntityList';

export default function PatentsListPage() {
  return (
    <EntityList
      entityType="patents"
      title="Patents"
      newPath="/rd/patents/new"
    />
  );
}
