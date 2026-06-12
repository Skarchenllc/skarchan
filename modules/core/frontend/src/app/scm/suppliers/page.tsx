'use client';

import EntityList from '@shared/components/EntityList';

export default function SuppliersListPage() {
  return (
    <EntityList
      entityType="suppliers"
      title="Suppliers"
      newPath="/scm/suppliers/new"
    />
  );
}
