'use client';

import EntityList from '@shared/components/EntityList';

export default function BenefitsPlansListPage() {
  return (
    <EntityList
      entityType="benefits_plans"
      title="Benefits Plans"
      newPath="/hr/benefits-plans/new"
    />
  );
}
