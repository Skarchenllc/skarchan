'use client';

import EntityList from '@shared/components/EntityList';

export default function CollaborationsListPage() {
  return (
    <EntityList
      entityType="rd_collaborations"
      title="Collaborations"
      newPath="/rd/collaborations/new"
    />
  );
}
