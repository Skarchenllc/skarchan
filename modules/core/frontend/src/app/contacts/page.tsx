'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';

type Bucket = { label: string; count: number };

export default function ContactsDashboardPage() {
  const [counts, setCounts] = useState({ people: 0, orgs: 0 });
  const [lifecycle, setLifecycle] = useState<Bucket[]>([]);
  const [category, setCategory] = useState<Bucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOf = async (entityType: string): Promise<any[]> => {
      try {
        const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j) ? j : (j.data || []);
      } catch { return []; }
    };
    const tally = (rows: any[], field: string): Bucket[] => {
      const m = new Map<string, number>();
      for (const rec of rows) {
        const v = rec?.data?.[field];
        const vals = Array.isArray(v) ? v : [v];
        for (const raw of vals) {
          const key = (raw === undefined || raw === null || raw === '') ? 'Unspecified' : String(raw);
          m.set(key, (m.get(key) || 0) + 1);
        }
      }
      return Array.from(m.entries()).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
    };
    (async () => {
      const [people, orgs] = await Promise.all([fetchOf('contacts'), fetchOf('sales_accounts')]);
      setCounts({ people: people.length, orgs: orgs.length });
      setLifecycle(tally(people, 'lifecycle_stage'));
      setCategory(tally(people, 'category'));
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const kpis: KpiItem[] = [
    { label: 'People',        value: counts.people, href: '/contacts/contacts' },
    { label: 'Organizations', value: counts.orgs,   href: '/contacts/organizations' },
  ];

  const Breakdown = ({ title, buckets }: { title: string; buckets: Bucket[] }) => (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {buckets.length === 0 ? (
        <p className="text-xs text-gray-400">No data.</p>
      ) : (
        <ul className="space-y-1.5">
          {buckets.map((b) => (
            <li key={b.label} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{b.label}</span>
              <span className="font-medium text-gray-900">{b.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="px-4 pb-6 space-y-6">
      <ModuleKpis items={kpis} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Breakdown title="People by lifecycle stage" buckets={lifecycle} />
        <Breakdown title="People by category" buckets={category} />
      </div>
    </div>
  );
}
