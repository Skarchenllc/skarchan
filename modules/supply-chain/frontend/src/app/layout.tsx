import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ModuleGuard from "@shared/components/ModuleGuard";
import './globals.css';
import Navigation from '@/components/Navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Supply Chain Management',
  description: 'Comprehensive supply chain and procurement management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          <Navigation />
          <div className="pt-16">
            <main className="max-w-7xl mx-auto px-6 py-8">
              <ModuleGuard moduleCode="supply-chain">{children}</ModuleGuard>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
