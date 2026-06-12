'use client';

import EntityList from '@shared/components/EntityList';

export default function SlaAgreementsListPage() {
  return (
    <EntityList
      entityType="sla_agreements"
      title="Sla Agreements"
      newPath="/customer-service/sla-agreements/new"
    />
  );
}
