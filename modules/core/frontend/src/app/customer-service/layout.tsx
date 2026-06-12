import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "CUSTOMER-SERVICE",
};

const STATS = [
  { label: 'Support Tickets', endpoint: '/api/v1/customer-service/support-tickets' },
  { label: 'Service Requests', endpoint: '/api/v1/customer-service/service-requests' }
];
// Ordered along the service workflow: contractual baseline → inbound
// requests → escalated tickets → reference content used to resolve.
const TABS = [
  { label: 'Dashboard',        href: '/customer-service', exact: true },
  { label: 'SLA',              href: '/customer-service/sla-agreements' },
  { label: 'Service Requests', href: '/customer-service/service-requests' },
  { label: 'Support Tickets',  href: '/customer-service/support-tickets' },
  { label: 'Knowledge Base',   href: '/customer-service/knowledge-base' },
  { label: 'Customer Feedback', href: '/customer-service/customer-feedback' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="customer-service">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Customer Service
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
