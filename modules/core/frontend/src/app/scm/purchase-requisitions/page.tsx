'use client';

import EntityList from '@shared/components/EntityList';

export default function PurchaseRequisitionsListPage() {
  return (
    <EntityList
      entityType="purchase_requisitions"
      title="Purchase Requisitions"
      newPath="/scm/purchase-requisitions/new"
    />
  );
}
