'use client';

import EntityList from '@shared/components/EntityList';

export default function StockMovementsListPage() {
  return (
    <EntityList
      entityType="stock_movements"
      title="Stock Movements"
      newPath="/inventory/stock-movements/new"
    />
  );
}
