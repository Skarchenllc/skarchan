'use client';

import EntityList from '@shared/components/EntityList';

export default function RiskListPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="risks"
        title="Risk Register"
        newPath="/administration/risks/new"
      />
    </div>
  );
}
