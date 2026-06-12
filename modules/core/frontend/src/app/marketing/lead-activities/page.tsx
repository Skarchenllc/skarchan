'use client';

import EntityList from '@shared/components/EntityList';

export default function LeadActivitiesListPage() {
  return (
    <EntityList
      entityType="lead_activities"
      title="Lead Activities"
      newPath="/marketing/lead-activities/new"
    />
  );
}
