'use client';

import EntityList from '@shared/components/EntityList';

export default function BankAccountsListPage() {
  return (
    <EntityList
      entityType="bank_accounts"
      title="Bank Accounts"
      newPath="/accounting/bank-accounts/new"
    />
  );
}
