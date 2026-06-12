'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Moved to Project Management; redirect old bookmarks.
export default function StrategicInitiativesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/pm/strategic-initiatives'); }, [router]);
  return null;
}
