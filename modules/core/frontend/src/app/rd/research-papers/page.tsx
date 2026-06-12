'use client';

import EntityList from '@shared/components/EntityList';

export default function ResearchPapersListPage() {
  return (
    <EntityList
      entityType="research_papers"
      title="Research Papers"
      newPath="/rd/research-papers/new"
    />
  );
}
