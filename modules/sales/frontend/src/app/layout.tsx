import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sales | Business Management",
  description: "Sales customers, opportunities, quotes, and orders management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased"><ModuleGuard moduleCode="sales">{children}</ModuleGuard></body>
    </html>
  );
}
