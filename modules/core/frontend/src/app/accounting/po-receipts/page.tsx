'use client';

import EntityList from '@shared/components/EntityList';

export default function PoReceiptsListPage() {
  return (
    <EntityList
      entityType="po_receipts"
      title="Po Receipts"
      newPath="/accounting/po-receipts/new"
    />
  );
}
