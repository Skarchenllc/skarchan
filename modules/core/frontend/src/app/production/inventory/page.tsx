'use client';

import EntityList from '@shared/components/EntityList';

export default function InventoryListPage() {
  return (
    <EntityList
      entityType="inventory"
      title="Inventory"
      newPath="/production/inventory/new"
    />
  );
}
