'use client';

import EntityList from '@shared/components/EntityList';

export default function CampaignActivitiesListPage() {
  return (
    <EntityList
      entityType="campaign_activities"
      title="Campaign Activities"
      newPath="/marketing/campaign-activities/new"
    />
  );
}
