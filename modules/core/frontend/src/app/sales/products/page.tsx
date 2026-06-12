'use client';

import EntityList from '@shared/components/EntityList';

export default function ProductsListPage() {
  return (
    <EntityList
      entityType="sales_products"
      title="Products & Price Book"
      newPath="/sales/products/new"
    />
  );
}
