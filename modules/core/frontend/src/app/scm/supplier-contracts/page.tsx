'use client';

import EntityList from '@shared/components/EntityList';

export default function SupplierContractsListPage() {
  return (
    <EntityList
      entityType="supplier_contracts"
      title="Supplier Contracts"
      newPath="/scm/supplier-contracts/new"
    />
  );
}
