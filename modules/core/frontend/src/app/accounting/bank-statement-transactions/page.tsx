'use client';

import EntityList from '@shared/components/EntityList';

export default function BankStatementTransactionsListPage() {
  return (
    <EntityList
      entityType="bank_statement_transactions"
      title="Bank Statement Transactions"
      newPath="/accounting/bank-statement-transactions/new"
    />
  );
}
