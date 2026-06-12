'use client';

import EntityList from '@shared/components/EntityList';

export default function ContractsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="contracts"
        title="Contracts"
        newPath="/administration/contracts/new"
      />
    </div>
  );
}
