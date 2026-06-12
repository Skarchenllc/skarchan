'use client';

import EntityList from '@shared/components/EntityList';

export default function RfqListPage() {
  return (
    <EntityList
      entityType="rfq"
      title="Rfq"
      newPath="/scm/rfq/new"
    />
  );
}
