'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function LeaveRequestsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="leave_requests"
        title="Leave Requests"
        newPath="/leave-requests/new"
      />
    </>
  );
}
