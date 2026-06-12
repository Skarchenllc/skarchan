'use client';

import EntityList from '@shared/components/EntityList';

export default function InsurancePolicyListPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="insurance_policies"
        title="Insurance Policies"
        newPath="/administration/insurance-policies/new"
      />
    </div>
  );
}
