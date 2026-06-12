'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function JobOffersListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="job_offers"
        title="Job Offers"
        newPath="/job-offers/new"
      />
    </>
  );
}
