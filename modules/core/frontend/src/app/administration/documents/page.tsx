'use client';

import EntityList from '@shared/components/EntityList';

export default function DocumentsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <EntityList
        entityType="documents"
        title="Document Management"
        newPath="/administration/documents/new"
      />
    </div>
  );
}
