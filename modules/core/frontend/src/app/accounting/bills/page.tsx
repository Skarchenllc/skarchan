'use client';

import EntityList from '@shared/components/EntityList';

export default function BillsListPage() {
  return (
    <EntityList
      entityType="bills"
      title="Bills"
      newPath="/accounting/bills/new"
    />
  );
}
