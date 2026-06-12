'use client';

import EntityList from '@shared/components/EntityList';

export default function BankStatementsListPage() {
  return (
    <EntityList
      entityType="bank_statements"
      title="Bank Statements"
      newPath="/accounting/bank-statements/new"
    />
  );
}
