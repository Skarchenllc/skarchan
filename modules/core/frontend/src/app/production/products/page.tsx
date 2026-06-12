'use client';

import EntityList from '@shared/components/EntityList';

export default function ProductsListPage() {
  return (
    <EntityList
      entityType="products"
      title="Products"
      newPath="/production/products/new"
    />
  );
}
