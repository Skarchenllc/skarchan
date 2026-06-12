import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Core System',
  description: 'Core System Management Platform',
};

// This is an auth-gated, client-rendered app (every page fetches per-user data
// at runtime with a token). Render dynamically instead of statically exporting —
// set on the root layout so it cascades to all routes, which a `'use client'`
// page cannot do itself. Fixes build-time prerender errors (e.g. useSearchParams
// on /settings) and matches how the app actually runs.
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <AppShell>{children}</AppShell>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
