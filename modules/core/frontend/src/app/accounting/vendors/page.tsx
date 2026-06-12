'use client';

import EntityList from '@shared/components/EntityList';

export default function VendorsListPage() {
  return (
    <EntityList
      entityType="vendors"
      title="Vendors"
      newPath="/accounting/vendors/new"
    />
  );
}
