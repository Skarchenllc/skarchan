'use client';

import EntityList from '@shared/components/EntityList';

export default function StockItemsListPage() {
  return (
    <EntityList
      entityType="stock_items"
      title="Stock Items"
      newPath="/inventory/stock-items/new"
    />
  );
}
