'use client';

import EntityList from '@shared/components/EntityList';

export default function PurchaseOrdersListPage() {
  return (
    <EntityList
      entityType="purchase_orders"
      title="Purchase Orders"
      newPath="/scm/purchase-orders/new"
    />
  );
}
