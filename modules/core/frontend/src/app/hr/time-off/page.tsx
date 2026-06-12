'use client';

import EntityList from '@shared/components/EntityList';

export default function TimeOffListPage() {
  return (
    <EntityList
      entityType="time_off"
      title="Time Off"
      newPath="/hr/time-off/new"
    />
  );
}
