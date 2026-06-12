import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "PRODUCTION",
};

const STATS = [
  { label: 'Products', endpoint: '/api/v1/production/production-products' },
  { label: 'Work Orders', endpoint: '/api/v1/production/work-orders' },
  { label: 'BOMs', endpoint: '/api/v1/production/bill-of-materials' },
  { label: 'Production Lines', endpoint: '/api/v1/production/production-lines' }
];
// Ordered along the manufacturing setup: catalog → recipe → physical
// production line → work orders running on those lines.
const TABS = [
  { label: 'Dashboard',        href: '/production', exact: true },
  { label: 'Products',         href: '/production/products' },
  { label: 'BOM',              href: '/production/bom' },
  { label: 'Production Lines', href: '/production/production-lines' },
  { label: 'Work Orders',      href: '/production/work-orders' },
  { label: 'Materials',        href: '/production/inventory' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="production">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Production
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
