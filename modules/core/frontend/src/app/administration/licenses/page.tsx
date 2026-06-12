'use client';

import EntityList from '@shared/components/EntityList';

export default function LicenseListPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="licenses"
        title="Licenses & Permits"
        newPath="/administration/licenses/new"
      />
    </div>
  );
}
