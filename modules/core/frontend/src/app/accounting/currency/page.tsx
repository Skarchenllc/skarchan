'use client';

import EntityList from '@shared/components/EntityList';

export default function CurrencyListPage() {
  return (
    <EntityList
      entityType="currency"
      title="Currency"
      newPath="/accounting/currency/new"
    />
  );
}
