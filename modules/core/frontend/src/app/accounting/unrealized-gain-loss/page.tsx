'use client';

import EntityList from '@shared/components/EntityList';

export default function UnrealizedGainLossListPage() {
  return (
    <EntityList
      entityType="unrealized_gain_loss"
      title="Unrealized Gain Loss"
      newPath="/accounting/unrealized-gain-loss/new"
    />
  );
}
