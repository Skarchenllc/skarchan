'use client';

import { useEffect, useState, useCallback } from 'react';
import { authHeaders, getJSON } from '@/components/ai/kit';

// HR Recruitment — a stage-by-stage hiring pipeline. The HR manager has each
// specialist draft its stage; you approve to apply it and unlock the next stage.
interface Stage { key: string; label: string; section: string; status: string; draft: any; record_id: string | null; record_label: string | null; expert: string | null; brief?: string | null; manager?: string | null }
interface Pipe { id: string; role: string; status: string; current_stage: number; stages: Stage[]; manager?: { name: string; role: string } | null }

const SKIP = new Set(['_id', 'id']);

export default function RecruitmentPage() {
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [manager, setManager] = useState<{ name: string; role: string } | null>(null);
  const [role, setRole] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await getJSON('/api/v1/ai/recruitment');
    setPipes(r?.data || []);
    setManager(r?.manager || null);
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async () => {
    if (!role.trim()) return;
    setBusy('start');
    try {
      await fetch('/api/v1/ai/recruitment/start', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ role }) });
      setRole(''); await load();
    } finally { setBusy(null); }
  };
  const act = async (id: string, action: 'approve' | 'redraft') => {
    setBusy(id + action);
    try { await fetch(`/api/v1/ai/recruitment/${id}/${action}`, { method: 'POST', headers: authHeaders() }); await load(); }
    finally { setBusy(null); }
  };

  const stageStyle = (s: Stage, isCurrent: boolean, completed: boolean) => {
    if (s.status === 'approved') return { background: '#dcfce7', color: '#166534' };
    if (s.status === 'draft_failed') return { background: '#fee2e2', color: '#991b1b' };
    if (isCurrent && !completed) return { background: '#5147e6', color: '#fff' };
    return { background: '#f1f5f9', color: '#94a3b8' };
  };

  return (
    <div className="px-1 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Hiring Pipeline</h2>
        <p className="text-[11px] text-gray-500 max-w-3xl mt-0.5">
          A stage-by-stage hiring pipeline run by your {manager ? <strong>HR Manager 🧑‍💼 {manager.name}</strong> : 'HR Manager'},
          who directs each section specialist through the stages. Each stage is drafted by its specialist; approve to create
          the record and unlock the next stage. Requisition → Advertisement → Shortlist → Interview → Background check → Offer.
        </p>
        {!manager && <p className="text-[11px] text-amber-600 mt-1">No HR manager hired yet — hire one on the AI Boardroom / Workers page so the pipeline runs in-character.</p>}
      </div>

      <div className="flex items-center gap-2">
        <input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') start(); }}
          placeholder="Hire for a role… e.g. “Senior Backend Engineer”"
          className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded" />
        <button onClick={start} disabled={busy === 'start'} className="ai-plan-btn text-sm disabled:opacity-50">
          {busy === 'start' ? 'Opening…' : '+ Start a hire'}
        </button>
      </div>

      {pipes.length === 0 && <div className="text-sm text-gray-400 py-10 text-center">No hires in progress. Start one above.</div>}

      {pipes.map((p) => {
        const cur = p.stages[p.current_stage];
        const completed = p.status === 'completed';
        return (
          <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-gray-900">
                Hire: {p.role}
                {p.manager && <span className="text-xs font-normal text-gray-400"> · run by 🧑‍💼 {p.manager.name}</span>}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-full" style={completed ? { background: '#dcfce7', color: '#166534' } : { background: '#dbeafe', color: '#1e40af' }}>
                {completed ? 'Complete' : `Stage ${p.current_stage + 1} of ${p.stages.length}`}
              </span>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-1 mt-3 flex-wrap">
              {p.stages.map((s, i) => (
                <div key={s.key} className="flex items-center">
                  <span className="text-[11px] px-2 py-1 rounded-full whitespace-nowrap" style={stageStyle(s, i === p.current_stage, completed)}
                    title={s.record_label || undefined}>
                    {s.status === 'approved' ? '✓ ' : ''}{s.label}
                  </span>
                  {i < p.stages.length - 1 && <span className="text-gray-300 mx-0.5">→</span>}
                </div>
              ))}
            </div>

            {/* Current stage draft + checkpoint */}
            {!completed && cur && (
              <div className="mt-3 rounded border border-gray-100 bg-gray-50 p-3">
                <div className="text-xs font-semibold text-gray-700 mb-1">
                  {cur.label}{cur.expert ? <span className="font-normal text-gray-400"> — drafted by {cur.expert}</span> : null}
                </div>
                {cur.brief && cur.manager && (
                  <div className="text-[11px] mb-2 rounded px-2 py-1.5" style={{ background: '#fffbeb', borderLeft: '2px solid #fbbf24', color: '#92400e' }}>
                    <span className="font-semibold">🧑‍💼 {cur.manager} instructed:</span> {cur.brief}
                  </div>
                )}
                {cur.status === 'draft_failed' ? (
                  <div className="text-[11px]" style={{ color: '#991b1b' }}>Draft failed: {cur.draft?._error || 'unknown error'}</div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
                    {Object.entries(cur.draft || {}).filter(([k, v]) => !SKIP.has(k) && v !== null && v !== '' && !k.startsWith('_')).slice(0, 16).map(([k, v]) => (
                      <div key={k} className="text-[11px]">
                        <span className="text-gray-400">{k.replace(/_/g, ' ')}: </span>
                        <span className="text-gray-700">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => act(p.id, 'approve')} disabled={!!busy || cur.status !== 'drafted'}
                    className="btn-approve text-xs font-semibold px-3 py-1.5 rounded disabled:opacity-50">
                    {busy === p.id + 'approve' ? 'Applying…' : '✓ Approve & continue'}
                  </button>
                  <button onClick={() => act(p.id, 'redraft')} disabled={!!busy}
                    className="btn-reject text-xs px-3 py-1.5 rounded disabled:opacity-50">
                    {busy === p.id + 'redraft' ? 'Re-drafting…' : '↻ Re-draft'}
                  </button>
                </div>
              </div>
            )}

            {/* What's been created so far (approved stages, with their record names) */}
            {p.stages.some((s) => s.record_id) && (
              <div className="mt-3">
                {completed && <div className="text-xs font-semibold text-green-700 mb-1">✓ Hire complete</div>}
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-0.5">
                  {p.stages.filter((s) => s.record_id).map((s) => (
                    <div key={s.key} className="text-[11px]">
                      <span className="text-green-600">✓ {s.label}: </span>
                      <span className="text-gray-700">{s.record_label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
