'use client';

import EntityList from '@shared/components/EntityList';

export default function CustomerFeedbackListPage() {
  return (
    <EntityList
      entityType="customer_feedback"
      title="Customer Feedback"
      newPath="/customer-service/customer-feedback/new"
    />
  );
}
