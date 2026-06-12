'use client';

import EntityList from '@shared/components/EntityList';

export default function FixedAssetsListPage() {
  return (
    <EntityList
      entityType="fixed_assets"
      title="Fixed Assets"
      newPath="/accounting/fixed-assets/new"
    />
  );
}
