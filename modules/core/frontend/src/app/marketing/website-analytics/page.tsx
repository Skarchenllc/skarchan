'use client';

import EntityList from '@shared/components/EntityList';

export default function WebsiteAnalyticsListPage() {
  return (
    <EntityList
      entityType="website_analytics"
      title="Website Analytics"
      newPath="/marketing/website-analytics/new"
    />
  );
}
