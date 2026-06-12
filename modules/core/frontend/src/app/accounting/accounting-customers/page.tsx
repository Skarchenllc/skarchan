'use client';

import EntityList from '@shared/components/EntityList';

export default function AccountingCustomersListPage() {
  return (
    <EntityList
      entityType="accounting_customers"
      title="Accounting Customers"
      newPath="/accounting/accounting-customers/new"
    />
  );
}
