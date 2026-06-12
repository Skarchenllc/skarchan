import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "ECOMMERCE",
};

const STATS = [
  { label: 'Products', endpoint: '/api/v1/ecommerce/products' },
  { label: 'Orders', endpoint: '/api/v1/ecommerce/orders' },
  { label: 'POS Sessions', endpoint: '/api/v1/ecommerce/pos-sessions' },
  { label: 'Storefronts', endpoint: '/api/v1/ecommerce/storefronts' }
];
// Ordered along the setup → operate flow: configure the storefronts →
// stock the catalog → sell (orders / point-of-sale events).
const TABS = [
  { label: 'Dashboard',    href: '/ecommerce', exact: true },
  { label: 'Storefronts',  href: '/ecommerce/storefronts' },
  { label: 'Products',     href: '/ecommerce/products' },
  { label: 'Orders',       href: '/ecommerce/orders' },
  { label: 'POS Sessions', href: '/ecommerce/pos-sessions' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="ecommerce">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        E-commerce / POS
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
