'use client';

import EntityList from '@shared/components/EntityList';

export default function OrdersListPage() {
  return (
    <EntityList
      entityType="orders"
      title="Orders"
      newPath="/ecommerce/orders/new"
    />
  );
}
