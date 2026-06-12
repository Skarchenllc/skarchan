'use client';

import EntityList from '@shared/components/EntityList';

export default function StorefrontsListPage() {
  return (
    <EntityList
      entityType="storefronts"
      title="Storefronts"
      newPath="/ecommerce/storefronts/new"
    />
  );
}
