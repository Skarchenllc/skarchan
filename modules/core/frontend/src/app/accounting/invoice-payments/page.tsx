'use client';

import EntityList from '@shared/components/EntityList';

export default function InvoicePaymentsListPage() {
  return (
    <EntityList
      entityType="invoice_payments"
      title="Invoice Payments"
      newPath="/accounting/invoice-payments/new"
    />
  );
}
