'use client';

import EntityList from '@shared/components/EntityList';

export default function StockTransfersListPage() {
  return (
    <EntityList
      entityType="stock_transfers"
      title="Stock Transfers"
      newPath="/inventory/stock-transfers/new"
    />
  );
}
