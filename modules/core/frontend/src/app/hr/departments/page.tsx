'use client';

import EntityList from '@shared/components/EntityList';

export default function DepartmentsListPage() {
  return (
    <EntityList
      entityType="departments"
      title="Departments"
      newPath="/hr/departments/new"
    />
  );
}
