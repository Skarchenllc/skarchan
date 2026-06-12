'use client';

import EntityList from '@shared/components/EntityList';

export default function CurrencyExchangeTransactionsListPage() {
  return (
    <EntityList
      entityType="currency_exchange_transactions"
      title="Currency Exchange Transactions"
      newPath="/accounting/currency-exchange-transactions/new"
    />
  );
}
