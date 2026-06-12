'use client';

import EntityList from '@shared/components/EntityList';

export default function WorkOrdersListPage() {
  return (
    <EntityList
      entityType="work_orders"
      title="Work Orders"
      newPath="/production/work-orders/new"
    />
  );
}
