'use client';

import EntityList from '@shared/components/EntityList';

export default function AttendanceListPage() {
  return (
    <EntityList
      entityType="attendance"
      title="Attendance"
      newPath="/hr/attendance/new"
    />
  );
}
