'use client';

import EntityList from '@shared/components/EntityList';

export default function PerformanceReviewsListPage() {
  return (
    <EntityList
      entityType="performance_reviews"
      title="Performance Reviews"
      newPath="/hr/performance-reviews/new"
    />
  );
}
