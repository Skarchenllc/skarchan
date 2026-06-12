'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function InventoryDashboardPage() {
  const [counts, setCounts] = useState({
    stockItems: 0, warehouses: 0, movements: 0, adjustments: 0, transfers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const countOf = async (entityType: string): Promise<number> => {
      try {
        const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
        if (!r.ok) return 0;
        const j = await r.json();
        const list = Array.isArray(j) ? j : (j.data || []);
        return list.length;
      } catch { return 0; }
    };
    (async () => {
      const [s, w, m, a, t] = await Promise.all([
        countOf('stock_items'),
        countOf('warehouses'),
        countOf('stock_movements'),
        countOf('stock_adjustments'),
        countOf('stock_transfers'),
      ]);
      setCounts({ stockItems: s, warehouses: w, movements: m, adjustments: a, transfers: t });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Stock Items',       value: counts.stockItems,  href: '/inventory/stock-items' },
    { label: 'Warehouses',        value: counts.warehouses,  href: '/inventory/warehouses' },
    { label: 'Stock Movements',   value: counts.movements,   href: '/inventory/stock-movements' },
    { label: 'Stock Adjustments', value: counts.adjustments, href: '/inventory/stock-adjustments' },
    { label: 'Stock Transfers',   value: counts.transfers,   href: '/inventory/stock-transfers' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
