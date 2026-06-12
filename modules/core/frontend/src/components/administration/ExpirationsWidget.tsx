'use client';

/**
 * ExpirationsWidget — lists records across multiple modules whose
 * `expires_at`, `renewal_date`, or `end_date` falls within the next 30 days.
 * Shows nothing if no items are due.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Item {
  id: string;
  title: string;
  due: string;        // YYYY-MM-DD
  daysAway: number;
  source: string;     // module label
  href: string;       // link to the record
}

const SOURCES: { endpoint: string; baseHref: string; label: string; dateField: string; titleField: string }[] = [
  { endpoint: '/api/v1/administration/credentials',   baseHref: '/administration/credentials',      label: 'Credential',   dateField: 'expires_at',   titleField: 'name' },
  { endpoint: '/api/v1/administration/contracts',     baseHref: '/administration/contracts',        label: 'Contract',     dateField: 'renewal_date', titleField: 'title' },
  { endpoint: '/api/v1/administration/contracts',     baseHref: '/administration/contracts',        label: 'Contract',     dateField: 'end_date',     titleField: 'title' },
  { endpoint: '/api/v1/administration/subscriptions', baseHref: '/administration/subscriptions',    label: 'Subscription', dateField: 'renewal_date', titleField: 'product_name' },
  { endpoint: '/api/v1/administration/documents',     baseHref: '/administration/documents',        label: 'Document',     dateField: 'due_date',     titleField: 'title' },
];

function daysBetween(dateStr: string): number | null {
  const due = new Date(dateStr);
  if (isNaN(due.getTime())) return null;
  const now = new Date();
  return Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function ExpirationsWidget() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const orgId = '00000000-0000-0000-0000-000000000000';
      const seen = new Set<string>();
      const all: Item[] = [];

      await Promise.all(SOURCES.map(async (s) => {
        try {
          const resp = await api.get(s.endpoint, { params: { organization_id: orgId } });
          const list: any[] = resp.data?.data || resp.data || [];
          for (const rec of list) {
            const d = rec?.[s.dateField] ?? rec?.data?.[s.dateField];
            if (!d) continue;
            const days = daysBetween(String(d));
            if (days === null) continue;
            if (days < 0 || days > 30) continue;
            const key = `${s.label}:${rec.id}:${s.dateField}`;
            if (seen.has(key)) continue;
            seen.add(key);
            all.push({
              id: rec.id,
              title: String(rec[s.titleField] ?? rec?.data?.[s.titleField] ?? '(untitled)'),
              due: String(d).slice(0, 10),
              daysAway: days,
              source: s.label,
              href: `${s.baseHref}/${rec.id}`,
            });
          }
        } catch {
          /* swallow */
        }
      }));

      all.sort((a, b) => a.daysAway - b.daysAway);
      setItems(all);
      setLoading(false);
    })();
  }, []);

  if (loading) return null;
  if (items.length === 0) return null;

  return (
    <div className="border bg-white p-5 mt-8">
      <h2 className="text-lg font-semibold mb-3">Expiring in the next 30 days ({items.length})</h2>
      <ul className="divide-y">
        {items.map(it => (
          <li key={`${it.source}-${it.id}-${it.due}`} className="py-2 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <Link href={it.href} className="underline">{it.title}</Link>
              <span className="ml-2 text-xs">· {it.source}</span>
            </div>
            <div className="text-sm shrink-0">
              {it.due}
              <span className="ml-2 text-xs">
                {it.daysAway === 0 ? 'today' : it.daysAway === 1 ? 'tomorrow' : `in ${it.daysAway} days`}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
