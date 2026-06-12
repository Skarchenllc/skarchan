import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "SCM",
};

const STATS = [
  { label: 'Suppliers', endpoint: '/api/v1/scm/suppliers' },
  { label: 'Purchase Orders', endpoint: '/api/v1/scm/purchase-orders' },
  { label: 'RFQs', endpoint: '/api/v1/scm/rfq' }
];
// Ordered along the procurement workflow: maintain vendors → internal
// purchase request → solicit quotes → issue purchase order.
const TABS = [
  { label: 'Dashboard',       href: '/scm', exact: true },
  { label: 'Suppliers',       href: '/scm/suppliers' },
  { label: 'Requisitions',    href: '/scm/purchase-requisitions' },
  { label: 'RFQs',            href: '/scm/rfq' },
  { label: 'Purchase Orders', href: '/scm/purchase-orders' },
  { label: 'Supplier Contracts', href: '/scm/supplier-contracts' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="scm">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Supply Chain Management
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
