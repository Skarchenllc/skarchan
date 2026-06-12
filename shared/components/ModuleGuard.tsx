'use client';

/**
 * Hides an entire module's UI when its is_active flag is false.
 *
 * On mount: fetch the module's status from /api/v1/development/modules.
 * - If active → render children.
 * - If inactive → redirect to /nexacore.
 * - If module not found in DB → render children (safe default; legacy modules
 *   without a DB row should still work).
 *
 * Bind-mounted into every frontend at /app/src/_shared/components/.
 */

import { useEffect, useState } from 'react';
import axios from 'axios';

interface ModuleGuardProps {
  moduleCode: string;
  children: React.ReactNode;
}

export default function ModuleGuard({ moduleCode, children }: ModuleGuardProps) {
  const [state, setState] = useState<'loading' | 'active' | 'redirecting'>('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await axios.get('/api/v1/development/modules');
        const items: any[] = r.data?.data || r.data || [];
        const found = items.find(m => m.module_code === moduleCode);
        if (cancelled) return;
        if (found && found.is_active === false) {
          setState('redirecting');
          // Use full navigation (not router.push) to escape this module's basePath.
          window.location.href = '/nexacore';
        } else {
          setState('active');
        }
      } catch {
        // If the modules endpoint is unreachable, fail-open: render the page.
        if (!cancelled) setState('active');
      }
    })();
    return () => { cancelled = true; };
  }, [moduleCode]);

  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  if (state === 'redirecting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-sm text-gray-600">This module is currently disabled. Redirecting…</div>
      </div>
    );
  }

  return <>{children}</>;
}
