'use client';

import EntityList from '@shared/components/EntityList';

export default function PosSessionsListPage() {
  return (
    <EntityList
      entityType="pos_sessions"
      title="Pos Sessions"
      newPath="/ecommerce/pos-sessions/new"
    />
  );
}
