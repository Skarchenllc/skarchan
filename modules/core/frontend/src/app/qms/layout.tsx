import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "Quality Management",
};

const STATS = [
  { label: 'Inspections', endpoint: '/api/v1/qms/inspections' },
  { label: 'Non-Conformances', endpoint: '/api/v1/qms/nonconformances' },
  { label: 'CAPA', endpoint: '/api/v1/qms/corrective-actions' }
];
// Ordered along the quality loop: inspect → log non-conformances →
// drive corrective/preventive action.
const TABS = [
  { label: 'Dashboard',          href: '/qms', exact: true },
  { label: 'Inspections',        href: '/qms/inspections' },
  { label: 'Non-Conformances',   href: '/qms/nonconformances' },
  { label: 'CAPA',               href: '/qms/corrective-actions' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="qms">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Quality Management
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
