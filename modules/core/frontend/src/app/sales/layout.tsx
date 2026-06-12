import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "Sales | Business Management",
  description: "Sales customers, opportunities, quotes, and orders management",
};

const STATS = [
  { label: 'Customers',     endpoint: '/api/v1/sales/customers' },
  { label: 'Opportunities', endpoint: '/api/v1/sales/opportunities' },
  { label: 'Quotes',        endpoint: '/api/v1/sales/quotes' },
  { label: 'Orders',        endpoint: '/api/v1/sales/orders' },
];
const TABS = [
  { label: 'Dashboard',     href: '/sales', exact: true },
  { label: 'Pipeline',      href: '/sales/pipeline' },
  { label: 'Customers',     href: '/sales/customers' },
  { label: 'Opportunities', href: '/sales/opportunities' },
  { label: 'Products',      href: '/sales/products' },
  { label: 'Quotes',        href: '/sales/quotes' },
  { label: 'Orders',        href: '/sales/orders' },
  { label: 'Builder',       href: '/sales/builder' },
  { label: 'Activities',    href: '/sales/activities' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="sales">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Sales
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
