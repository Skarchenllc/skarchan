'use client';

import EntityList from '@shared/components/EntityList';

export default function LeaveRequestsListPage() {
  return (
    <EntityList
      entityType="leave_requests"
      title="Leave Requests"
      newPath="/hr/leave-requests/new"
    />
  );
}
