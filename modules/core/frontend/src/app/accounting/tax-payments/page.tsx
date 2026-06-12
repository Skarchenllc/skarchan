'use client';

import EntityList from '@shared/components/EntityList';

export default function TaxPaymentsListPage() {
  return (
    <EntityList
      entityType="tax_payments"
      title="Tax Payments"
      newPath="/accounting/tax-payments/new"
    />
  );
}
