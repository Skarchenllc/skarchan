'use client';

import EntityList from '@shared/components/EntityList';

export default function LeadsListPage() {
  return (
    <EntityList
      entityType="leads"
      title="Leads"
      newPath="/marketing/leads/new"
    />
  );
}
