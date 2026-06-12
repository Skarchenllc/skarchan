'use client';

import EntityList from '@shared/components/EntityList';

export default function ServiceRequestsListPage() {
  return (
    <EntityList
      entityType="service_requests"
      title="Service Requests"
      newPath="/customer-service/service-requests/new"
    />
  );
}
