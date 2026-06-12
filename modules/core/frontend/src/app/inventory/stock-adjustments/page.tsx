'use client';

import EntityList from '@shared/components/EntityList';

export default function StockAdjustmentsListPage() {
  return (
    <EntityList
      entityType="stock_adjustments"
      title="Stock Adjustments"
      newPath="/inventory/stock-adjustments/new"
    />
  );
}
