'use client';

import EntityList from '@shared/components/EntityList';

export default function BomListPage() {
  return (
    <EntityList
      entityType="bill_of_materials"
      title="Bom"
      newPath="/production/bom/new"
    />
  );
}
