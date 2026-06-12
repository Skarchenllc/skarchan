'use client';

/**
 * Generic catch-all entity browser at /modules/<module>/<entity>.
 *
 * Used for entities that don't have their own dedicated page.tsx — most
 * commonly entities just created via the Create Entity wizard. Delegates
 * to the shared EntityList, which already handles every concern (search,
 * picklist filters, date range, references, import/export, etc.) and
 * falls back to the generic entity-records API for newly-created types.
 */

import { useParams } from 'next/navigation';
import EntityList from '@shared/components/EntityList';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function GenericEntityListPage() {
  const params = useParams();
  const moduleCode = params.module as string;
  const entitySlug = params.entity as string;
  const entityType = entitySlug.replace(/-/g, '_');

  return (
    <ProtectedRoute>
      <EntityList
        entityType={entityType}
        newPath={`/modules/${moduleCode}/${entitySlug}/new`}
      />
    </ProtectedRoute>
  );
}
