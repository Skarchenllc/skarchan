'use client';

import EntityList from '@shared/components/EntityList';

/**
 * Insights — analytical/read-only roll-up of transactions. No direct
 * record creation; filters limited to the dimensions a user actually
 * pivots on (date range + account type).
 */
export default function InsightsListPage() {
  return (
    <EntityList
      entityType="transactions"
      title="Insights"
      readOnly
      filters={['account_type']}
    />
  );
}
