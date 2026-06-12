'use client';

import EntityList from '@shared/components/EntityList';

export default function CurrenciesListPage() {
  return (
    <EntityList
      entityType="currencies"
      title="Currencies"
      newPath="/accounting/currencies/new"
    />
  );
}
