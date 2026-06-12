'use client';

import EntityList from '@shared/components/EntityList';

export default function CredentialsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="credentials"
        title="Credentials"
        newPath="/administration/credentials/new"
      />
    </div>
  );
}
