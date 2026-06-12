'use client';

import EntityList from '@shared/components/EntityList';

export default function JobOffersListPage() {
  return (
    <EntityList
      entityType="job_offers"
      title="Job Offers"
      newPath="/hr/job-offers/new"
    />
  );
}
