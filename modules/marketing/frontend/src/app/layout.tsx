import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marketing | Business Management",
  description: "Marketing campaigns, leads, and content management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased"><ModuleGuard moduleCode="marketing">{children}</ModuleGuard></body>
    </html>
  );
}
