'use client';

import EntityList from '@shared/components/EntityList';

export default function CorrectiveActionsListPage() {
  return (
    <EntityList
      entityType="qms_corrective_actions"
      title="Corrective & Preventive Actions (CAPA)"
      newPath="/qms/corrective-actions/new"
    />
  );
}
