'use client';

import EntityList from '@shared/components/EntityList';

export default function InspectionsListPage() {
  return (
    <EntityList
      entityType="qms_inspections"
      title="Inspections"
      newPath="/qms/inspections/new"
    />
  );
}
