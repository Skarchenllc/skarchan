import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ModuleGuard from "@shared/components/ModuleGuard";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Human Resources Management",
  description: "Employee management, leave tracking, and performance reviews",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}><ModuleGuard moduleCode="hr">{children}</ModuleGuard></body>
    </html>
  );
}
