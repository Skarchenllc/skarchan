'use client';

import EntityList from '@shared/components/EntityList';

export default function AccountsListPage() {
  return (
    <EntityList
      entityType="accounts"
      title="Accounts"
      newPath="/accounting/accounts/new"
    />
  );
}
