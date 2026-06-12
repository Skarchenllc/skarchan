'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to Accounting & Finance; redirect old bookmarks.
export default function SubscriptionsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/accounting/subscriptions'); }, [router]);
  return null;
}
