'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to Accounting & Finance; redirect old bookmarks.
export default function AssetMgmtRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/accounting/asset-management'); }, [router]);
  return null;
}
