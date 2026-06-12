'use client';

import EntityList from '@shared/components/EntityList';

export default function SubscriptionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="subscriptions"
        title="Subscriptions"
        newPath="/accounting/subscriptions/new"
      />
    </div>
  );
}
