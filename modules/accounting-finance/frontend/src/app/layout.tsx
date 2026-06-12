import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ModuleGuard from "@shared/components/ModuleGuard";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ToastProvider } from "@/context/toast-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Accounting & Finance",
  description: "Enterprise Accounting and Finance Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <div className="min-h-screen bg-background">
            <Navigation />
            {/* Main content area - header navigation only */}
            <div className="pt-16">
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ModuleGuard moduleCode="accounting">{children}</ModuleGuard>
              </main>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
