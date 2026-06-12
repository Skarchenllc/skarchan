import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "CONTACTS",
};

const STATS = [
  { label: 'People',        endpoint: '/api/v1/contacts/contacts' },
  { label: 'Organizations', endpoint: '/api/v1/contacts/organizations' },
];
// Central system-of-record for people + organizations. Other modules
// (Sales, Marketing, Service…) reference these records rather than copying them.
const TABS = [
  { label: 'Dashboard',     href: '/contacts', exact: true },
  { label: 'Contacts',      href: '/contacts/contacts' },
  { label: 'Organizations', href: '/contacts/organizations' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="contacts">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Contacts
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
