'use client';

import EntityList from '@shared/components/EntityList';

export default function AutomationsListPage() {
  return (
    <EntityList
      entityType="automations"
      title="Automation Rules"
      newPath="/nexacore/automation/new"
    />
  );
}
