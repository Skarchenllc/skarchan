'use client';

import EntityList from '@shared/components/EntityList';

export default function ExchangeRatesListPage() {
  return (
    <EntityList
      entityType="exchange_rates"
      title="Exchange Rates"
      newPath="/accounting/exchange-rates/new"
    />
  );
}
