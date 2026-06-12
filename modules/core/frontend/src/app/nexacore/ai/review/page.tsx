'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders, getJSON } from '@/components/ai/kit';

// Review — ONE unified approval list. Everything awaiting a human decision,
// whatever its source, normalised into a single feed:
//   • Alerts / Briefings  → the AI noticed something  → Acknowledge
//   • Proposed changes     → the AI wants to edit a record → Approve / Reject
//   • Queued actions       → an automation/manager queued an AI action → Approve / Reject
// Sorted so the items needing a real decision sit at the top.

type Kind = 'proposal' | 'job' | 'alert' | 'briefing';
interface Item {
  id: string;
  kind: Kind;
  rank: number;        // sort priority (lower = higher up)
  when: string;
  where: string;
  title: string;
  node: React.ReactNode; // the body (changes / findings / result)
}

const BADGE: Record<Kind, { label: string; bg: string; fg: string }> = {
  proposal: { label: 'Proposed change', bg: '#dcfce7', fg: '#065f46' },
  job:      { label: 'Queued action',   bg: '#fef3c7', fg: '#92400e' },
  alert:    { label: 'Alert',           bg: '#fee2e2', fg: '#991b1b' },
  briefing: { label: 'Briefing',        bg: '#eef2ff', fg: '#3730a3' },
};

export default function ReviewPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [ib, pd, jb] = await Promise.all([
      getJSON('/api/v1/ai/insights?include_acknowledged=false&limit=50'),
      getJSON('/api/v1/ai/pending?limit=50'),
      getJSON('/api/v1/development/entity-records?entity_type=ai_jobs&limit=200'),
    ]);
    setInsights(ib?.data || []);
    setPending(pd?.data || []);
    setJobs((jb?.data || []).map((x: any) => ({ id: x.id, ...x.data })));
  }, []);
  useEffect(() => { reload(); }, [reload]);

  const act = async (key: string, url: string, drop: () => void) => {
    setBusy(key); setMsg(null);
    try {
      const r = await fetch(url, { method: 'POST', headers: authHeaders() });
      if (r.ok) drop(); else setMsg('That action was not allowed — sign in as an admin and try again.');
    } catch { setMsg('Something went wrong applying that.'); } finally { setBusy(null); }
  };

  const runProactive = async () => {
    setRunning('scan'); setMsg(null);
    try { await fetch('/api/v1/ai/proactive/run', { method: 'POST', headers: authHeaders() }); await reload(); }
    finally { setRunning(null); }
  };
  const runQueue = async () => {
    setRunning('queue'); setMsg(null);
    try { await fetch('/api/v1/automation/ai-jobs/run', { method: 'POST', headers: authHeaders() }); await reload(); }
    finally { setRunning(null); }
  };

  // ---- normalise the three sources into one feed ------------------------
  const items: Item[] = [];

  for (const p of pending) {
    items.push({
      id: 'p' + p.id, kind: 'proposal', rank: 0, when: p.created_at || '',
      where: `${p.module_code}/${p.entity_type}`, title: p.label || 'Proposed change',
      node: (
        <>
          <div className="text-xs text-gray-600 mt-0.5">
            {Object.entries(p.changes || {}).map(([k, v]: any) => (
              <span key={k} className="mr-2"><span className="text-gray-400">{k} →</span> {String(v)}</span>
            ))}
          </div>
          {p.reason && <div className="text-[11px] text-gray-400 mt-0.5">{p.reason}</div>}
          <Actions
            approve={() => act('p' + p.id, `/api/v1/ai/pending/${p.id}/approve`, () => setPending((x) => x.filter((i) => i.id !== p.id)))}
            reject={() => act('p' + p.id, `/api/v1/ai/pending/${p.id}/reject`, () => setPending((x) => x.filter((i) => i.id !== p.id)))}
            busy={!!busy}
          />
        </>
      ),
    });
  }

  for (const j of jobs.filter((x) => x.status === 'Pending Review')) {
    items.push({
      id: 'j' + j.id, kind: 'job', rank: 1, when: j.ran_at || j.queued_at || '',
      where: `${j.module_code}/${j.entity_type}`,
      title: `${j.capability}${j.target_field ? ` → ${j.target_field}` : ''}`,
      node: (
        <>
          <div className="text-xs text-gray-600 mt-0.5">{j.result || (j.proposed_draft ? 'Drafted change awaiting approval' : j.error || '—')}</div>
          {j.source_automation && <div className="text-[11px] text-gray-400 mt-0.5">from “{j.source_automation}”</div>}
          <Actions
            approve={() => act('j' + j.id, `/api/v1/automation/ai-jobs/${j.id}/approve`, () => setJobs((x) => x.filter((i) => i.id !== j.id)))}
            reject={() => act('j' + j.id, `/api/v1/automation/ai-jobs/${j.id}/reject`, () => setJobs((x) => x.filter((i) => i.id !== j.id)))}
            busy={!!busy}
          />
        </>
      ),
    });
  }

  for (const ins of insights) {
    const isBrief = ins.capability_id === 'manager_brief';
    const sev = ins.severity_max;
    items.push({
      id: 'i' + ins.id, kind: isBrief ? 'briefing' : 'alert',
      rank: isBrief ? 4 : sev === 'high' ? 2 : 3, when: ins.created_at || '',
      where: `${ins.module_code}${isBrief ? '' : `/${ins.entity_type}`}`,
      title: ins.summary || (isBrief ? 'Manager briefing' : 'Risk alert'),
      node: (
        <>
          {(ins.findings || []).length > 0 && (
            <ul className="mt-1.5 text-sm text-gray-700 space-y-1">
              {ins.findings.slice(0, 5).map((f: any, i: number) => (
                <li key={i}>
                  <span className="text-[10px] uppercase mr-1" style={{ color: f.severity === 'high' ? '#dc2626' : f.severity === 'medium' ? '#b45309' : '#6b7280' }}>[{f.severity}]</span>
                  {f.title}{f.recommendation ? <span className="text-gray-400"> — {f.recommendation}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {(ins.priorities || []).length > 0 && (
            <ul className="list-disc ml-5 mt-1.5 text-sm text-gray-700">{ins.priorities.slice(0, 4).map((p: string, i: number) => <li key={i}>{p}</li>)}</ul>
          )}
          <div className="mt-2">
            <button className="text-xs px-2.5 py-1 border border-gray-300 rounded text-gray-600 disabled:opacity-50"
              disabled={busy === 'i' + ins.id}
              onClick={() => act('i' + ins.id, `/api/v1/ai/insights/${ins.id}/ack`, () => setInsights((x) => x.filter((i) => i.id !== ins.id)))}>
              {busy === 'i' + ins.id ? '…' : 'Acknowledge'}
            </button>
          </div>
        </>
      ),
    });
  }

  items.sort((a, b) => a.rank - b.rank || b.when.localeCompare(a.when));

  const queuedToRun = jobs.filter((j) => j.status === 'Queued').length;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500 max-w-2xl">
          Everything waiting on you, in one list — the AI surfaces risks and proposes changes here; nothing is written to your
          records until you approve it. Each item is tagged with where it came from.
        </p>
        <button onClick={runProactive} disabled={!!running} className="ai-plan-btn text-sm disabled:opacity-60 shrink-0">
          {running === 'scan' ? 'Scanning…' : 'Run scans + briefings'}
        </button>
      </div>

      {queuedToRun > 0 && (
        <div className="p-2.5 text-[11px] rounded border flex items-center justify-between gap-3 flex-wrap"
          style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#92400e' }}>
          <span>{queuedToRun} AI job{queuedToRun !== 1 ? 's are' : ' is'} queued to run.</span>
          <button onClick={runQueue} disabled={!!running} className="underline font-semibold disabled:opacity-50">
            {running === 'queue' ? 'Running…' : 'Run them now'}
          </button>
        </div>
      )}

      {msg && <div className="p-2 text-[11px] rounded border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{msg}</div>}

      {items.length === 0 ? (
        <div className="text-sm text-gray-400 py-12 text-center">✓ Nothing to review — you’re all caught up.</div>
      ) : (
        <div className="space-y-2">
          {items.map((it) => {
            const b = BADGE[it.kind];
            return (
              <div key={it.id} className="bg-white border border-gray-200 rounded-lg p-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: b.bg, color: b.fg }}>{b.label}</span>
                  <span className="text-xs text-gray-500">{it.where}</span>
                  <span className="text-xs text-gray-300">{(it.when || '').slice(0, 16).replace('T', ' ')}</span>
                </div>
                <div className="text-sm text-gray-800 mt-1.5 font-medium">{it.title}</div>
                {it.node}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Actions({ approve, reject, busy }: { approve: () => void; reject: () => void; busy: boolean }) {
  return (
    <div className="flex gap-2 mt-2">
      <button onClick={approve} disabled={busy} className="btn-approve text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-50">✓ Approve</button>
      <button onClick={reject} disabled={busy} className="btn-reject text-xs px-3 py-1.5 rounded disabled:opacity-50">Reject</button>
    </div>
  );
}
