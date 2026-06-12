'use client';

import { useEffect, useState } from 'react';

type Stat = { count: number; amount: number; by_status: Record<string, number> };
interface Props {
  funnel?: { label: string; t: string }[];      // ordered conversion funnel
  status?: { title: string; t: string }[];        // "<title> by status" breakdowns
}

const FUNNEL_COLORS = ['#60a5fa', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

const statusColor = (label: string): string => {
  const s = (label || '').toLowerCase();
  if (/(paid|active|complete|done|won|approved|resolved|achieved|deliver|publish|hired|in stock|cleared|posted|closed)/.test(s)) return '#01411C';
  if (/(overdue|cancel|fail|reject|lost|block|missed|expired|terminat|out of stock|discrepan|void)/.test(s)) return '#ef4444';
  if (/(pending|progress|draft|sent|partial|review|scheduled|qualified|proposal|negotiat|prospect|hold|processing|open|new)/.test(s)) return '#f59e0b';
  return '#94a3b8';
};

export default function ModuleStatusCharts({ funnel, status }: Props) {
  const [stats, setStats] = useState<Record<string, Stat>>({});

  useEffect(() => {
    const types = Array.from(new Set([...(funnel || []).map(f => f.t), ...(status || []).map(s => s.t)]));
    if (!types.length) return;
    fetch(`/api/v1/development/entity-analytics?entity_types=${types.join(',')}`)
      .then(r => r.ok ? r.json() : { data: {} })
      .then(j => setStats(j?.data || {}))
      .catch(() => setStats({}));
  }, [funnel, status]);

  const S = (t: string): Stat => stats[t] || { count: 0, amount: 0, by_status: {} };

  return (
    <div className="space-y-4 mt-2">
      {funnel && funnel.length > 0 && (() => {
        const data = funnel.map((f, i) => ({ ...f, value: S(f.t).count, color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }));
        const max = Math.max(1, ...data.map(d => d.value));
        return (
          <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Sales conversion funnel</h3>
            <div className="space-y-2">
              {data.map((d, i) => {
                const prev = i > 0 ? data[i - 1].value : null;
                const conv = prev && prev > 0 ? Math.round((d.value / prev) * 100) : null;
                return (
                  <div key={d.label} className="flex items-center gap-3">
                    <div className="w-28 text-xs font-medium text-gray-600 text-right shrink-0">{d.label}</div>
                    <div className="flex-1">
                      <div className="h-7 rounded-md flex items-center px-3 text-white text-sm font-semibold"
                           style={{ width: `${Math.max(8, (d.value / max) * 100)}%`, backgroundColor: d.color, minWidth: 48 }}>{d.value}</div>
                    </div>
                    <div className="w-14 text-xs text-gray-400 shrink-0">{conv != null ? `${conv}%` : '—'}</div>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Right column = conversion vs previous stage.</p>
          </div>
        );
      })()}

      {status && status.length > 0 && (
        <div className={`grid grid-cols-1 ${status.length > 1 ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-4`}>
          {status.map(({ title, t }) => {
            const entries = Object.entries(S(t).by_status);
            const max = Math.max(1, ...entries.map(([, v]) => v));
            return (
              <div key={t} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{title}</h3>
                {entries.length === 0 ? <div className="text-xs text-gray-400">No data yet.</div> : (
                  <div className="space-y-1.5">
                    {entries.sort((a, b) => b[1] - a[1]).map(([name, value]) => (
                      <div key={name} className="flex items-center gap-2">
                        <div className="w-24 text-xs text-gray-600 truncate text-right shrink-0">{name}</div>
                        <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
                          <div className="h-5 rounded" style={{ width: `${Math.max(6, 100 * value / max)}%`, background: statusColor(name) }} />
                        </div>
                        <div className="w-8 text-xs text-gray-500 shrink-0 text-right">{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
