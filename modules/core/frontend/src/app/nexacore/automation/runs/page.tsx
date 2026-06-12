'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { StatCard, getJSON } from '@/components/ai/kit';

// Automation Run History — the audit log of the automation engine: every time a
// rule's trigger + condition matched and an action fired, it's recorded here as
// an `automation_runs` record. This is a read-only timeline, not a CRUD list.

interface Run {
  id: string;
  created_at: string;
  data: {
    automation_name?: string;
    trigger_entity?: string;
    record_id?: string | null;
    action_type?: string;
    status?: string;        // success | failed | skipped
    detail?: string;
    run_at?: string;
  };
}

const ACTION_LABEL: Record<string, string> = {
  set_field: 'Set field',
  create_activity: 'Create activity',
  create_record: 'Create record',
  send_email: 'Send email',
  enrol_journey: 'Enrol journey',
  ai_run: 'Run AI',
};
const actionLabel = (a?: string) => ACTION_LABEL[a || ''] || (a || '—').replace(/_/g, ' ');

const statusStyle = (s?: string) =>
  s === 'success' ? { bg: '#dcfce7', fg: '#166534', icon: '✓' }
    : s === 'skipped' ? { bg: '#f1f5f9', fg: '#475569', icon: '–' }
      : { bg: '#fee2e2', fg: '#991b1b', icon: '✕' };

export default function AutomationRunsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('all');
  const [action, setAction] = useState<string>('all');
  const [query, setQuery] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    getJSON('/api/v1/development/entity-records?entity_type=automation_runs&limit=500')
      .then((r) => setRuns(r?.data || []))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const s = { total: runs.length, success: 0, failed: 0, skipped: 0, automations: new Set<string>() };
    for (const r of runs) {
      const st = r.data?.status;
      if (st === 'success') s.success++;
      else if (st === 'skipped') s.skipped++;
      else s.failed++;
      if (r.data?.automation_name) s.automations.add(r.data.automation_name);
    }
    return s;
  }, [runs]);

  const actionTypes = useMemo(() => Array.from(new Set(runs.map((r) => r.data?.action_type).filter(Boolean))) as string[], [runs]);

  const filtered = useMemo(() => runs.filter((r) => {
    if (status !== 'all') {
      const st = r.data?.status === 'success' ? 'success' : r.data?.status === 'skipped' ? 'skipped' : 'failed';
      if (st !== status) return false;
    }
    if (action !== 'all' && r.data?.action_type !== action) return false;
    if (query) {
      const hay = `${r.data?.automation_name} ${r.data?.trigger_entity} ${r.data?.detail}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  }), [runs, status, action, query]);

  const chip = (active: boolean) =>
    `text-[11px] px-2.5 py-1 rounded-full border ${active ? 'font-semibold' : ''}`;
  const chipStyle = (active: boolean) =>
    active ? { background: '#5147e6', color: '#fff', borderColor: '#5147e6' } : { background: '#fff', color: '#475569', borderColor: '#e5e7eb' };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        The automation engine's audit trail. Each row is one rule firing — when a record changed and a rule's trigger and
        condition matched, the action that ran is logged here. Read-only; to edit rules, go to{' '}
        <a className="underline font-semibold" href="/nexacore/automation" style={{ color: '#5147e6' }}>Automations</a>.
      </p>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Actions fired" value={String(stats.total)} />
        <StatCard label="Succeeded" value={String(stats.success)} sub={stats.total ? `${Math.round((stats.success / stats.total) * 100)}% of runs` : undefined} />
        <StatCard label="Failed" value={String(stats.failed)} />
        <StatCard label="Active rules" value={String(stats.automations.size)} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'success', 'failed', 'skipped'].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={chip(status === s)} style={chipStyle(status === s)}>
            {s === 'all' ? 'All statuses' : s}
          </button>
        ))}
        {actionTypes.length > 0 && <span className="w-px h-4 bg-gray-200 mx-1" />}
        {actionTypes.length > 0 && (
          <button onClick={() => setAction('all')} className={chip(action === 'all')} style={chipStyle(action === 'all')}>All actions</button>
        )}
        {actionTypes.map((a) => (
          <button key={a} onClick={() => setAction(a)} className={chip(action === a)} style={chipStyle(action === a)}>{actionLabel(a)}</button>
        ))}
        <div className="flex-1" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search rule, entity, detail…"
          className="text-sm px-3 py-1.5 border border-gray-300 rounded w-56" />
        <button onClick={load} className="text-[11px] underline text-gray-500">Refresh</button>
      </div>

      {/* Audit table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-gray-100 flex items-center justify-between" style={{ color: '#5147e6' }}>
          <span>Run history</span>
          <span className="text-xs font-normal text-gray-400">{filtered.length} of {runs.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 whitespace-nowrap">When</th>
                <th className="text-left px-3 py-2">Automation</th>
                <th className="text-left px-3 py-2">Trigger entity</th>
                <th className="text-left px-3 py-2">Action</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (<tr><td colSpan={6} className="px-3 py-8 text-center text-gray-400">Loading…</td></tr>)}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-10 text-center text-gray-400">
                  {runs.length === 0
                    ? 'No automations have fired yet. Once a rule on the Automations page matches a record change, its actions will appear here.'
                    : 'No runs match the current filters.'}
                </td></tr>
              )}
              {!loading && filtered.map((r) => {
                const ss = statusStyle(r.data?.status);
                const when = (r.data?.run_at || r.created_at || '').slice(0, 19).replace('T', ' ');
                return (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{when}</td>
                    <td className="px-3 py-2 text-gray-800">{r.data?.automation_name || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{r.data?.trigger_entity || '—'}</td>
                    <td className="px-3 py-2 text-gray-700">{actionLabel(r.data?.action_type)}</td>
                    <td className="px-3 py-2">
                      <span className="px-1.5 py-0.5 rounded-full font-semibold whitespace-nowrap" style={{ background: ss.bg, color: ss.fg }}>
                        {ss.icon} {r.data?.status || 'failed'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-md truncate" title={r.data?.detail || ''}>{r.data?.detail || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
