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
