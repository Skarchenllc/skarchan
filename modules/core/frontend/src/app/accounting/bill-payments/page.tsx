'use client';

import EntityList from '@shared/components/EntityList';

export default function BillPaymentsListPage() {
  return (
    <EntityList
      entityType="bill_payments"
      title="Bill Payments"
      newPath="/accounting/bill-payments/new"
    />
  );
}
