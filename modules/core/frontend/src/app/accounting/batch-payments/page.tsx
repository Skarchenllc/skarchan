'use client';

import EntityList from '@shared/components/EntityList';

export default function BatchPaymentsListPage() {
  return (
    <EntityList
      entityType="batch_payments"
      title="Batch Payments"
      newPath="/accounting/batch-payments/new"
    />
  );
}
