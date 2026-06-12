'use client';

import EntityList from '@shared/components/EntityList';

export default function LearningListPage() {
  return (
    <EntityList
      entityType="learning"
      title="Learning"
      newPath="/hr/learning/new"
    />
  );
}
