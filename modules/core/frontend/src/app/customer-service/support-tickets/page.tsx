'use client';

import EntityList from '@shared/components/EntityList';

export default function SupportTicketsListPage() {
  return (
    <EntityList
      entityType="support_tickets"
      title="Support Tickets"
      newPath="/customer-service/support-tickets/new"
    />
  );
}
