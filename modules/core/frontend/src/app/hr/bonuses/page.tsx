'use client';

import EntityList from '@shared/components/EntityList';

export default function BonusesListPage() {
  return (
    <EntityList
      entityType="bonuses"
      title="Bonuses"
      newPath="/hr/bonuses/new"
    />
  );
}
