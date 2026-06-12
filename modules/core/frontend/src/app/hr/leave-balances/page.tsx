'use client';

import EntityList from '@shared/components/EntityList';

/**
 * Leave Balances — derived from approved leave requests, not directly
 * editable. Read-only view, no Add New / Import.
 */
export default function LeaveBalancesListPage() {
  return (
    <EntityList
      entityType="leave_balances"
      title="Leave Balances"
      readOnly
    />
  );
}
