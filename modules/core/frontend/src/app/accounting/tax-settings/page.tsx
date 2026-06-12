'use client';

import EntityList from '@shared/components/EntityList';

export default function TaxSettingsListPage() {
  return (
    <EntityList
      entityType="tax_settings"
      title="Tax Settings"
      newPath="/accounting/tax-settings/new"
    />
  );
}
