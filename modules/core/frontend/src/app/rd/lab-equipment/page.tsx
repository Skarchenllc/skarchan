'use client';

import EntityList from '@shared/components/EntityList';

export default function LabEquipmentListPage() {
  return (
    <EntityList
      entityType="lab_equipment"
      title="Lab Equipment"
      newPath="/rd/lab-equipment/new"
    />
  );
}
