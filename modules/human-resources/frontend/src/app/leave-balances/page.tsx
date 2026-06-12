'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function LeaveBalancesListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="leave_balances"
        title="Leave Balances"
        newPath="/leave-balances/new"
      />
    </>
  );
}
