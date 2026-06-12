'use client';

import EntityList from '@shared/components/EntityList';

export default function TaxRatesListPage() {
  return (
    <EntityList
      entityType="tax_rates"
      title="Tax Rates"
      newPath="/accounting/tax-rates/new"
    />
  );
}
