'use client';

import EntityList from '@shared/components/EntityList';

export default function TasksListPage() {
  return (
    <EntityList
      entityType="pm_tasks"
      title="Tasks"
      newPath="/pm/tasks/new"
    />
  );
}
