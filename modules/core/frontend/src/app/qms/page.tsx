'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

export default function QmsDashboardPage() {
  const [counts, setCounts] = useState({
    inspections: 0, nonconformances: 0, capa: 0,
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
      const [i, n, c] = await Promise.all([
        countOf('qms_inspections'),
        countOf('qms_nonconformances'),
        countOf('qms_corrective_actions'),
      ]);
      setCounts({ inspections: i, nonconformances: n, capa: c });
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'Inspections',      value: counts.inspections,     href: '/qms/inspections' },
    { label: 'Non-Conformances', value: counts.nonconformances, href: '/qms/nonconformances' },
    { label: 'CAPA',             value: counts.capa,            href: '/qms/corrective-actions' },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={kpis} />
    </div>
  );
}
