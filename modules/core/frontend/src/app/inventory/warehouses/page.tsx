'use client';

import EntityList from '@shared/components/EntityList';

export default function WarehousesListPage() {
  return (
    <EntityList
      entityType="warehouses"
      title="Warehouses"
      newPath="/inventory/warehouses/new"
    />
  );
}
