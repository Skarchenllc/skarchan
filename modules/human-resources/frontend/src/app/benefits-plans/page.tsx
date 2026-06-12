'use client';

import Navigation from '@/components/Navigation';
import EntityList from '@shared/components/EntityList';

export default function BenefitsPlansListPage() {
  return (
    <>
      <Navigation />
      <EntityList
        entityType="benefits_plans"
        title="Benefits Plans"
        newPath="/benefits-plans/new"
      />
    </>
  );
}
