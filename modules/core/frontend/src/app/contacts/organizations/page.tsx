'use client';

import EntityList from '@shared/components/EntityList';

export default function OrganizationsListPage() {
  return (
    <EntityList
      entityType="sales_accounts"
      title="Organizations"
      newPath="/contacts/organizations/new"
    />
  );
}
