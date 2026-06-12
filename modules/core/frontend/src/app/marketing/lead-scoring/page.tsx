'use client';

import { useEffect, useState, useCallback } from 'react';

interface Rec { id: string; data: Record<string, any>; }

const GRADE_COLOR: Record<string, string> = { Hot: '#dc2626', Warm: '#d97706', Cold: '#5147e6' };

export default function LeadScoringPage() {
  const [rules, setRules] = useState<Rec[]>([]);
  const [events, setEvents] = useState<Rec[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [r1, r2, c] = await Promise.all([
        fetch('/api/v1/development/entity-records?entity_type=scoring_rules&limit=100').then(r => r.json()),
        fetch('/api/v1/development/entity-records?entity_type=lead_score_events&limit=20').then(r => r.json()),
        fetch('/api/v1/marketing-ops/scoring/catalog').then(r => r.json()).catch(() => null),
      ]);
      setRules((r1.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
      setEvents((r2.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
      setCatalog(c);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function recompute() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/v1/marketing-ops/scoring/recompute', { method: 'POST' });
      setMsg(`Recompute: ${JSON.stringify(await r.json())}`);
      await load();
    } catch (e: any) { setMsg(`Failed: ${e?.message || e}`); } finally { setBusy(false); }
  }

  const defaults = catalog?.default_points || {};
  const threshold = catalog?.qualify_threshold ?? 50;
  const decay = catalog?.decay;

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Lead Scoring</h2>
          <p className="text-xs text-gray-500">
            Engagement adds points. At <strong>{threshold}+</strong> a lead auto-qualifies and fires its handoff automation.
            {decay && (
              <> Scores <strong>decay</strong>: full for {decay.grace_days}d, then halve every {decay.half_life_days}d of inactivity.</>
            )}
          </p>
        </div>
        <button onClick={recompute} disabled={busy}
          className="px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>
          {busy ? 'Recomputing…' : '↻ Apply decay & recompute'}
        </button>
      </div>

      {msg && <div className="mb-3 p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono break-all">{msg}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Scoring Rules</h3>
          <div className="text-xs text-gray-500 mb-2">Grades:
            {['Cold', 'Warm', 'Hot'].map(g => (
              <span key={g} className="ml-2 px-1.5 py-0.5 rounded" style={{ color: GRADE_COLOR[g], background: '#f8fafc' }}>{g} {catalog?.grades?.[g]}</span>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-gray-400"><th className="py-1">Event</th><th>Points</th></tr></thead>
            <tbody>
              {(rules.length ? rules.map(r => [r.data.event, r.data.points]) : Object.entries(defaults)).map(([ev, pts]: any, i) => (
                <tr key={i} className="border-t" style={{ borderColor: '#f1f5f9' }}>
                  <td className="py-1.5 text-gray-700">{ev}</td>
                  <td className="font-semibold text-gray-900">+{pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rules.length && <p className="text-xs text-gray-400 mt-2">Showing engine defaults — add <code>scoring_rules</code> records to override.</p>}
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Recent Score Events</h3>
          {events.length === 0 ? (
            <p className="text-xs text-gray-400">No scoring activity yet. Recompute, or log a lead activity.</p>
          ) : (
            <ul className="space-y-1.5">
              {events.map(e => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate">{e.data.lead_name || '—'} · {e.data.event}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-green-600 font-semibold">+{e.data.points}</span>
                    <span className="text-gray-400 text-xs">{e.data.old_score}→{e.data.new_score}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: GRADE_COLOR[e.data.grade], background: '#f8fafc' }}>{e.data.grade}</span>
                    {e.data.qualified && <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: '#01411C' }}>QUALIFIED</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
