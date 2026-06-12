'use client';

import EntityList from '@shared/components/EntityList';

export default function TrainingListPage() {
  return (
    <EntityList
      entityType="training"
      title="Training"
      newPath="/hr/training/new"
    />
  );
}
