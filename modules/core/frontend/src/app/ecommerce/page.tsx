'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function EcommerceDashboardPage() {
  const [counts, setCounts] = useState({
    products: 0, orders: 0, sessions: 0, storefronts: 0,
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
      const [p, o, s, sf] = await Promise.all([
        countOf('products'),
        countOf('orders'),
        countOf('pos_sessions'),
        countOf('storefronts'),
      ]);
      setCounts({ products: p, orders: o, sessions: s, storefronts: sf });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Products',     value: counts.products,    href: '/ecommerce/products' },
    { label: 'Orders',       value: counts.orders,      href: '/ecommerce/orders' },
    { label: 'POS Sessions', value: counts.sessions,    href: '/ecommerce/pos-sessions' },
    { label: 'Storefronts',  value: counts.storefronts, href: '/ecommerce/storefronts' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
