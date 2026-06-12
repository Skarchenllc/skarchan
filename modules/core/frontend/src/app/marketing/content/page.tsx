'use client';

import EntityList from '@shared/components/EntityList';

export default function ContentListPage() {
  return (
    <EntityList
      entityType="contents"
      title="Content"
      newPath="/marketing/content/new"
    />
  );
}
