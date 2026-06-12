'use client';

import EntityList from '@shared/components/EntityList';

export default function TimeEntriesListPage() {
  return (
    <EntityList
      entityType="time_entries"
      title="Time Entries"
      newPath="/accounting/time-entries/new"
    />
  );
}
