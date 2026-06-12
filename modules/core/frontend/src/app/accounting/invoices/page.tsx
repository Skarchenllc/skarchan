'use client';

import EntityList from '@shared/components/EntityList';

export default function InvoicesListPage() {
  return (
    <EntityList
      entityType="invoices"
      title="Invoices"
      newPath="/accounting/invoices/new"
    />
  );
}
