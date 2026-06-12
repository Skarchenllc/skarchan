'use client';

import EntityList from '@shared/components/EntityList';

export default function ChartOfAccountsListPage() {
  return (
    <EntityList
      entityType="chart_of_accounts"
      title="Chart Of Accounts"
      newPath="/accounting/chart-of-accounts/new"
    />
  );
}
