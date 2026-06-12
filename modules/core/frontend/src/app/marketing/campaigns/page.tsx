'use client';

import EntityList from '@shared/components/EntityList';

export default function CampaignsListPage() {
  return (
    <EntityList
      entityType="campaigns"
      title="Campaigns"
      newPath="/marketing/campaigns/new"
    />
  );
}
