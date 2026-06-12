'use client';

import EntityList from '@shared/components/EntityList';

export default function AssetsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="assets"
        title="Asset Management"
        newPath="/accounting/asset-management/new"
      />
    </div>
  );
}
