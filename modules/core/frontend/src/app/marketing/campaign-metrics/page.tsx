'use client';

import EntityList from '@shared/components/EntityList';

export default function CampaignMetricsListPage() {
  return (
    <EntityList
      entityType="campaign_metrics"
      title="Campaign Metrics"
      newPath="/marketing/campaign-metrics/new"
    />
  );
}
