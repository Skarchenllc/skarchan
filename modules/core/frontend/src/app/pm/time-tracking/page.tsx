'use client';

import EntityList from '@shared/components/EntityList';

export default function TimeTrackingListPage() {
  return (
    <EntityList
      entityType="time_tracking"
      title="Time Tracking"
      newPath="/pm/time-tracking/new"
    />
  );
}
