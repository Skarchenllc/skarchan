'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Compliance Audits now lives inside the merged /administration/compliance
// tabbed view. This stub redirects so existing bookmarks still work.
export default function CompliancePauditsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/administration/compliance');
  }, [router]);
  return null;
}
