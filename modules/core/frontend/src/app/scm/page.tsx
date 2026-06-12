'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function ScmDashboardPage() {
  const [counts, setCounts] = useState({
    suppliers: 0, requisitions: 0, rfqs: 0, orders: 0, contracts: 0,
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
      const [s, r, q, o, c] = await Promise.all([
        countOf('suppliers'),
        countOf('purchase_requisitions'),
        countOf('rfqs'),
        countOf('purchase_orders'),
        countOf('supplier_contracts'),
      ]);
      setCounts({ suppliers: s, requisitions: r, rfqs: q, orders: o, contracts: c });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Suppliers',           value: counts.suppliers,    href: '/scm/suppliers' },
    { label: 'Purchase Requisitions', value: counts.requisitions, href: '/scm/purchase-requisitions' },
    { label: 'RFQs',                value: counts.rfqs,         href: '/scm/rfq' },
    { label: 'Purchase Orders',     value: counts.orders,       href: '/scm/purchase-orders' },
    { label: 'Supplier Contracts',  value: counts.contracts,    href: '/scm/supplier-contracts' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
