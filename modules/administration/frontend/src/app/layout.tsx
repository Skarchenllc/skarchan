import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Navigation from "@/components/Navigation"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Control Room - Enterprise Management Platform",
  description: "Enterprise headquarters for monitoring and managing all business operations",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <Navigation />

          {/* Main content area with padding-top for fixed header */}
          <div className="pt-16">
            <main className="flex-1 min-h-screen">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <ModuleGuard moduleCode="administration">{children}</ModuleGuard>
              </div>

              <footer className="bg-white border-t border-gray-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  <p className="text-sm text-gray-500 text-center">
                    Administration v1.0.0 - Enterprise Management Platform
                  </p>
                </div>
              </footer>
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
