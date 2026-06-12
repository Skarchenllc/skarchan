'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function PerformanceReviewsListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="performance_reviews"
        title="Performance Reviews"
        newPath="/performance-reviews/new"
      />
    </>
  );
}
