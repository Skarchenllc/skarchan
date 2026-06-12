import type { Metadata } from "next";
import ModuleGuard from "@shared/components/ModuleGuard";
import ModuleBanner from "@/components/ModuleBanner";

export const metadata: Metadata = {
  title: "INVENTORY",
};

const STATS = [
  { label: 'Stock Items', endpoint: '/api/v1/inventory/stock-items' },
  { label: 'Warehouses', endpoint: '/api/v1/inventory/warehouses' }
];
// Ordered along the inventory setup: where stock lives → what stock
// is → day-to-day movements → cross-warehouse transfers.
const TABS = [
  { label: 'Dashboard',   href: '/inventory', exact: true },
  { label: 'Warehouses',  href: '/inventory/warehouses' },
  { label: 'Stock Items', href: '/inventory/stock-items' },
  { label: 'Movements',   href: '/inventory/stock-movements' },
  { label: 'Transfers',   href: '/inventory/stock-transfers' },
  { label: 'Adjustments', href: '/inventory/stock-adjustments' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ModuleGuard moduleCode="inventory">
      <h1 className="text-xl font-bold mb-3" style={{ letterSpacing: '0.02em' }}>
        Inventory
      </h1>
      <ModuleBanner stats={STATS} tabs={TABS} />
      {children}
    </ModuleGuard>
  );
}
