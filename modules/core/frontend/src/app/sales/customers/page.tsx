'use client';

import EntityList from '@shared/components/EntityList';

export default function CustomersListPage() {
  return (
    <EntityList
      entityType="customers"
      title="Customers"
      newPath="/sales/customers/new"
    />
  );
}
