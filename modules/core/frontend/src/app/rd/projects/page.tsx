'use client';

import EntityList from '@shared/components/EntityList';

export default function ProjectsListPage() {
  return (
    <EntityList
      entityType="rd_projects"
      title="R&D Projects"
      newPath="/rd/projects/new"
    />
  );
}
