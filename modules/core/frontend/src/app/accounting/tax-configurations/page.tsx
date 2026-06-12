'use client';

import EntityList from '@shared/components/EntityList';

export default function TaxConfigurationsListPage() {
  return (
    <EntityList
      entityType="tax_configurations"
      title="Tax Configurations"
      newPath="/accounting/tax-configurations/new"
    />
  );
}
