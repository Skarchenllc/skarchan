'use client';

import EntityList from '@shared/components/EntityList';

export default function KnowledgeBaseListPage() {
  return (
    <EntityList
      entityType="knowledge_base"
      title="Knowledge Base"
      newPath="/customer-service/knowledge-base/new"
    />
  );
}
