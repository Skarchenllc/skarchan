'use client';

import EntityList from '@shared/components/EntityList';

export default function PaymentRemindersListPage() {
  return (
    <EntityList
      entityType="payment_reminders"
      title="Payment Reminders"
      newPath="/accounting/payment-reminders/new"
    />
  );
}
