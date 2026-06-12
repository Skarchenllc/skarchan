'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function ProductionDashboardPage() {
  const [counts, setCounts] = useState({
    products: 0, workOrders: 0, stockItems: 0, productionLines: 0,
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
      const [p, w, s, pl] = await Promise.all([
        countOf('products'),
        countOf('work_orders'),
        countOf('stock_items'),
        countOf('production_lines'),
      ]);
      setCounts({ products: p, workOrders: w, stockItems: s, productionLines: pl });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Products',         value: counts.products,        href: '/production/products' },
    { label: 'Work Orders',      value: counts.workOrders,      href: '/production/work-orders' },
    { label: 'Stock Items',      value: counts.stockItems,      href: '/inventory/stock-items' },
    { label: 'Production Lines', value: counts.productionLines, href: '/production/production-lines' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
