'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function BonusesListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="bonuses"
        title="Bonuses"
        newPath="/bonuses/new"
      />
    </>
  );
}
