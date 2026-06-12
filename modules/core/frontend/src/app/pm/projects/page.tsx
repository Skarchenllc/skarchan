'use client';

import EntityList from '@shared/components/EntityList';
import AiProjectPlanner from '@/components/pm/AiProjectPlanner';

export default function ProjectsListPage() {
  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-6 flex justify-end">
        <AiProjectPlanner />
      </div>
      <EntityList
        entityType="pm_projects"
        title="Projects"
        newPath="/pm/projects/new"
      />
    </>
  );
}
