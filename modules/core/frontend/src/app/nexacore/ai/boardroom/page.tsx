'use client';

import { useEffect, useState, useCallback } from 'react';
import { Avatar, AvatarUpload, MicButton, authHeaders, getJSON, resizeImage } from '@/components/ai/kit';

// Boardroom — the org's command room. You brief the CEO (or a manager); the org
// "meets" and seniors instruct juniors down the chain, who execute. The cascade
// is rendered as a meeting transcript. You only ever talk at the CEO / Manager level.

interface Unit { module: string; manager: string | null; label?: string }

function Speaker({ kind, name, role, src, tint, children }: { kind?: 'ceo' | 'manager' | 'expert'; name: string; role?: string; src?: string; tint: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1.5">
      <Avatar name={name} src={src} kind={kind} size={24} />
      <div className="min-w-0">
        <div className="text-xs font-semibold" style={{ color: tint }}>{name}{role ? <span className="font-normal text-gray-400"> · {role}</span> : null}</div>
        <div className="text-sm text-gray-700">{children}</div>
      </div>
    </div>
  );
}

function Steps({ steps }: { steps: any[] }) {
  const tone = (s: string) => s === 'applied' ? '#01411C' : s === 'pending review' ? '#d97706' : (s === 'blocked' || s === 'failed' || s === 'skipped') ? '#dc2626' : '#64748b';
  return (
    <div className="mt-1 space-y-1 border-l-2 pl-3" style={{ borderColor: '#e5e7eb' }}>
      {(steps || []).map((s, i) => (
        <Speaker key={i} kind="expert" src={s.expert_avatar} name={s.expert || `${s.section} staff`} role={s.capability} tint="#475569">
          <span style={{ color: tone(s.status), fontWeight: 600 }}>{s.status}</span>
          {s.result && <div className="text-xs text-gray-500 mt-0.5">{String(s.result).slice(0, 240)}</div>}
        </Speaker>
      ))}
    </div>
  );
}

// Renders a manager-level run ({manager, summary, steps}) as a conversation.
function ManagerThread({ run, module }: { run: any; module?: string }) {
  if (run.error) return <div className="text-xs" style={{ color: '#92400e' }}>{run.error}</div>;
  return (
    <div>
      <Speaker kind="manager" src={run.manager_avatar} name={run.manager || `${module || 'Unit'} manager`} role="manager" tint="#3730a3">
        {run.summary || 'Working on it.'}
      </Speaker>
      <div className="pl-6"><Steps steps={run.steps} /></div>
    </div>
  );
}

// Renders a full CEO run ({ceo, summary, departments:[{manager, steps}]}).
// Three tiers: CEO → department manager → specialist.
function CeoThread({ run }: { run: any }) {
  if (run.error) return <div className="text-xs" style={{ color: '#92400e' }}>{run.error}</div>;
  return (
    <div>
      <Speaker kind="ceo" src={run.ceo_avatar} name={run.ceo || 'CEO'} role="CEO" tint="#5147e6">{run.summary || 'Setting direction.'}</Speaker>
      <div className="pl-6 space-y-2 mt-1">
        {(run.departments || []).map((d: any, i: number) => <ManagerThread key={i} run={d} module={d.module} />)}
      </div>
    </div>
  );
}

export default function BoardroomPage() {
  const [ceo, setCeo] = useState<string | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [ceoText, setCeoText] = useState('');
  const [ceoRun, setCeoRun] = useState<any>(null);
  const [mgrModule, setMgrModule] = useState('');
  const [mgrSection, setMgrSection] = useState('');
  const [mgrText, setMgrText] = useState('');
  const [mgrRun, setMgrRun] = useState<any>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    const [jb, pd] = await Promise.all([
      getJSON('/api/v1/development/entity-records?entity_type=ai_jobs&limit=100'),
      getJSON('/api/v1/ai/pending?limit=100'),
    ]);
    const ent = (s: string) => (s || '').replace(/_/g, ' ');
    const jobs = (jb?.data || []).map((x: any) => ({ id: x.id, ...x.data }))
      .filter((j: any) => j.status === 'Pending Review')
      .map((j: any) => ({
        id: j.id, kind: 'job',
        action: j.capability === 'create_record' ? `➕ Create a new ${ent(j.entity_type) || 'record'}`
          : j.capability === 'update_record' ? `✏️ Update ${j.target_field || 'a field'}` : j.capability,
        where: `${j.module_code}/${ent(j.entity_type)}`,
        fields: (j.proposed_draft && typeof j.proposed_draft === 'object')
          ? Object.entries(j.proposed_draft).filter(([k, v]) => !['id', '_id'].includes(k) && v != null && v !== '').slice(0, 6) : [],
        note: j.result,
      }));
    const props = (pd?.data || []).map((p: any) => ({
      id: p.id, kind: 'proposal',
      action: `✏️ Update ${p.label || 'a record'}`,
      where: `${p.module_code}/${ent(p.entity_type)}`,
      fields: Object.entries(p.changes || {}).slice(0, 6),
      note: p.reason,
    }));
    setPending([...props, ...jobs]);
  }, []);
  const actOn = async (item: any, action: 'approve' | 'reject') => {
    setActing(item.id);
    try {
      const url = item.kind === 'proposal'
        ? `/api/v1/ai/pending/${item.id}/${action}`
        : `/api/v1/automation/ai-jobs/${item.id}/${action}`;
      await fetch(url, { method: 'POST', headers: authHeaders() });
      setPending((p) => p.filter((x) => x.id !== item.id));
    } catch { /* noop */ } finally { setActing(null); }
  };

  const load = useCallback(async () => {
    // List every department that has a manager (not just AI-enabled ones), sourced
    // from the actual hired workers so it always matches the Team page.
    const [wk, md] = await Promise.all([
      getJSON('/api/v1/ai/workers'),
      getJSON('/api/v1/development/modules-with-entity-types'),
    ]);
    const mods = Array.isArray(md) ? md : md?.data || [];
    const label: Record<string, string> = {};
    for (const m of mods) label[m.module_code] = m.module_label;
    const workers = wk?.data || [];
    setWorkers(workers);
    setCeo(workers.find((w: any) => w.entity_type === '__ceo__')?.name || null);
    const us: Unit[] = workers
      .filter((w: any) => w.entity_type === '__manager__' && w.enabled !== false)
      .map((w: any) => ({ module: w.module_code, manager: w.name, label: label[w.module_code] || w.module_code }))
      .sort((a: Unit, b: Unit) => (a.label || '').localeCompare(b.label || ''));
    setUnits(us);
    if (us.length && !mgrModule) setMgrModule(us[0].module);
  }, [mgrModule]);
  useEffect(() => { load(); loadPending(); }, [load, loadPending]);

  const briefCeo = async () => {
    if (!ceoText.trim()) return;
    setBusy('ceo'); setCeoRun(null);
    try {
      const r = await fetch('/api/v1/ai/org', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ instruction: ceoText }) }).then((x) => x.json());
      setCeoRun(r); await loadPending();
    } catch { setCeoRun({ error: 'CEO run failed' }); } finally { setBusy(null); }
  };
  const tellManager = async () => {
    if (!mgrText.trim() || !mgrModule) return;
    setBusy('mgr'); setMgrRun(null);
    try {
      const body: any = { module_code: mgrModule, instruction: mgrText };
      if (mgrSection) body.section = mgrSection;  // third level: target one specialist
      const r = await fetch('/api/v1/ai/delegate', { method: 'POST', headers: authHeaders(), body: JSON.stringify(body) }).then((x) => x.json());
      setMgrRun(r); await loadPending();
    } catch { setMgrRun({ error: 'Delegation failed' }); } finally { setBusy(null); }
  };

  const hasPending = (run: any) => {
    if (!run) return false;
    const steps = run.steps || (run.departments || []).flatMap((d: any) => d.steps || []);
    return (steps || []).some((s: any) => s.status === 'pending review');
  };

  // Set a worker's photo right from the boardroom (same resize-and-embed as the Team page).
  const uploadAvatar = async (worker: any, file: File) => {
    if (!worker) return;
    try {
      const avatar = await resizeImage(file);
      await fetch('/api/v1/ai/workers', {
        method: 'PUT', headers: authHeaders(),
        body: JSON.stringify({
          module_code: worker.module_code, entity_type: worker.entity_type, name: worker.name, role: worker.role,
          persona: worker.persona || '', avatar, autonomy: worker.autonomy, capabilities: worker.capabilities || [], enabled: worker.enabled,
        }),
      });
      await load();
    } catch { /* ignore */ }
  };
  const ceoWorker = workers.find((w) => w.entity_type === '__ceo__');
  const managerWorker = workers.find((w) => w.entity_type === '__manager__' && w.module_code === mgrModule);
  const PSEUDO_ETS = ['__ceo__', '__manager__', '__division__'];
  const specialists = workers.filter((w) => w.module_code === mgrModule && !PSEUDO_ETS.includes(w.entity_type) && w.enabled !== false);
  const targetWorker = mgrSection ? specialists.find((w) => w.entity_type === mgrSection) : managerWorker;

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      <div className="flex-1 min-w-0 space-y-5">
      <p className="text-sm text-gray-500">
        Your meeting room. Brief the <strong>CEO</strong> for company-wide work, or talk to a <strong>manager</strong> directly.
        The team meets, seniors instruct their staff down the chain, and the experts execute — you only ever talk at the top
        two levels. Anything they want to change still waits for your sign-off in <a className="underline" href="/nexacore/ai/review" style={{ color: '#5147e6' }}>Approvals</a>.
        Hire and train the people you meet here on the <a className="underline" href="/nexacore/ai/team" style={{ color: '#5147e6' }}>Team</a> page.
      </p>

      {/* Brief the CEO */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 border-l-4" style={{ background: '#eef2ff', borderColor: '#5147e6' }}>
          <div className="flex items-center gap-2">
            {ceoWorker
              ? <AvatarUpload name={ceoWorker.name} src={ceoWorker.avatar} kind="ceo" size={28} onPick={(file) => uploadAvatar(ceoWorker, file)} />
              : <span>🏢</span>}
            <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>Brief the CEO{ceo ? ` — ${ceo}` : ''}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input value={ceoText} onChange={(e) => setCeoText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') briefCeo(); }}
              placeholder={`Tell ${ceo || 'the CEO'} what the company needs… e.g. “tighten financial controls and chase stalled deals”`}
              className="flex-1 text-sm px-3 py-2 rounded border border-gray-300" />
            <MicButton onText={(t) => setCeoText((p) => (p ? p + ' ' : '') + t)} />
            <button onClick={briefCeo} disabled={busy === 'ceo'} className="ai-plan-btn text-xs disabled:opacity-50">
              {busy === 'ceo' ? 'Convening…' : 'Convene'}
            </button>
          </div>
          {busy === 'ceo' && (
            <div className="text-[11px] text-gray-500 mt-1.5">
              ⏳ Working… the CEO is briefing the department managers, who are tasking their specialists in parallel across the org. This usually takes a few seconds.
            </div>
          )}
        </div>
        {ceoRun && (
          <div className="p-4 bg-white space-y-3">
            {ceoRun.error && <div className="text-xs" style={{ color: '#92400e' }}>{ceoRun.error}</div>}
            {ceoRun.report && <ReportNote initial={ceoRun.report} instruction={ceoRun.instruction || ceoText} reportInput={ceoRun.report_input || ''} scope="company" />}
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer select-none">▸ View the discussion (how the team got here)</summary>
              <div className="mt-2"><CeoThread run={ceoRun} /></div>
            </details>
            {hasPending(ceoRun) && <div className="text-[11px] text-gray-500">↪ Sign off the proposed changes in the <strong>Approvals</strong> panel on the right.</div>}
          </div>
        )}
      </div>

      {/* Talk to a manager */}
      <div className="rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-2.5 bg-indigo-50">
          <div className="flex items-center gap-2 flex-wrap">
            {targetWorker
              ? <AvatarUpload name={targetWorker.name} src={targetWorker.avatar} kind={mgrSection ? 'expert' : 'manager'} size={26} onPick={(file) => uploadAvatar(targetWorker, file)} />
              : <span>🧑‍💼</span>}
            <span className="text-sm font-semibold" style={{ color: '#3730a3' }}>Instruct a manager or specialist</span>
            <select value={mgrModule} onChange={(e) => { setMgrModule(e.target.value); setMgrSection(''); }} className="text-sm px-2 py-1 border border-gray-300 rounded">
              {units.map((u) => <option key={u.module} value={u.module}>{u.manager ? `${u.manager} — ${u.label || u.module}` : `${u.label || u.module} manager`}</option>)}
            </select>
            {specialists.length > 0 && (
              <select value={mgrSection} onChange={(e) => setMgrSection(e.target.value)} className="text-sm px-2 py-1 border border-gray-300 rounded">
                <option value="">🧑‍💼 Whole department (manager)</option>
                {specialists.map((s) => <option key={s.entity_type} value={s.entity_type}>🧑 {s.name}</option>)}
              </select>
            )}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input value={mgrText} onChange={(e) => setMgrText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') tellManager(); }}
              placeholder={mgrSection ? 'Give this specialist a task…' : "Give this manager a task — it'll instruct its team…"}
              className="flex-1 text-sm px-3 py-2 rounded border border-gray-300" />
            <MicButton onText={(t) => setMgrText((p) => (p ? p + ' ' : '') + t)} />
            <button onClick={tellManager} disabled={busy === 'mgr'} className="ai-plan-btn text-xs disabled:opacity-50">
              {busy === 'mgr' ? 'Working…' : 'Instruct'}
            </button>
          </div>
          {busy === 'mgr' && (
            <div className="text-[11px] text-gray-500 mt-1.5">⏳ Working… {mgrSection ? 'the specialist is on it' : 'the manager is tasking its specialists'}. This usually takes a few seconds.</div>
          )}
        </div>
        {mgrRun && (
          <div className="p-4 bg-white space-y-3">
            {mgrRun.report && <ReportNote initial={mgrRun.report} instruction={mgrRun.instruction || mgrText} reportInput={mgrRun.report_input || ''} scope={mgrModule} />}
            <details>
              <summary className="text-xs text-gray-500 cursor-pointer select-none">▸ View the discussion</summary>
              <div className="mt-2"><ManagerThread run={mgrRun} module={mgrModule} /></div>
            </details>
          </div>
        )}
      </div>
      </div>

      {/* Approvals — sign off right here, no need to leave the meeting */}
      <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-4">
        <ApprovalsPanel pending={pending} acting={acting} onAct={actOn} onRefresh={loadPending} />
      </aside>
    </div>
  );
}

// The synthesised decision note — the actual answer, with Save / Share / Refine.
function ReportNote({ initial, instruction, reportInput, scope }:
  { initial: any; instruction: string; reportInput: string; scope: string }) {
  const [report, setReport] = useState<any>(initial);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refineOpen, setRefineOpen] = useState(false);
  const [refineText, setRefineText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  if (!report) return null;

  const asText = () => {
    const find = (report.key_findings || []).map((f: string) => `• ${f}`).join('\n');
    const recs = (report.recommendations || []).map((r: any, i: number) => `${i + 1}. ${r.action} — ${r.why}`).join('\n');
    const gaps = (report.data_gaps || []).map((g: string) => `• ${g}`).join('\n');
    return `${report.title}\n\n${report.summary}\n\nKey findings:\n${find}\n\nRecommendations:\n${recs}${gaps ? `\n\nData gaps:\n${gaps}` : ''}`;
  };
  const save = async () => {
    setBusy('save');
    try {
      await fetch('/api/v1/development/entity-records', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ entity_type: 'ai_reports', module_code: 'core', created_by: '00000000-0000-0000-0000-000000000001',
          data: { ...report, instruction, scope, created_at: new Date().toISOString() } }),
      });
      setSaved(true);
    } catch { /* noop */ } finally { setBusy(null); }
  };
  const share = async () => {
    try { await navigator.clipboard.writeText(asText()); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* noop */ }
  };
  const refine = async () => {
    if (!refineText.trim()) return;
    setBusy('refine');
    try {
      const r = await fetch('/api/v1/ai/synthesize', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ goal: instruction, report_input: reportInput, refinement: refineText }),
      }).then((x) => x.json());
      if (r.report) { setReport(r.report); setSaved(false); setRefineOpen(false); setRefineText(''); }
    } catch { /* noop */ } finally { setBusy(null); }
  };

  return (
    <div className="rounded-lg border-2 p-4" style={{ borderColor: '#5147e6', background: '#f8fafc' }}>
      <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#5147e6' }}>📝 Decision note</div>
      <h3 className="text-base font-semibold text-gray-900 mt-1">{report.title}</h3>
      <p className="text-sm text-gray-700 mt-1">{report.summary}</p>
      {(report.key_findings || []).length > 0 && (
        <div className="mt-3"><div className="text-xs font-semibold text-gray-500">Key findings</div>
          <ul className="list-disc ml-5 text-sm text-gray-700 mt-0.5">{report.key_findings.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul></div>
      )}
      {(report.recommendations || []).length > 0 && (
        <div className="mt-3"><div className="text-xs font-semibold text-gray-500">Recommendations</div>
          <ol className="list-decimal ml-5 text-sm text-gray-700 mt-0.5 space-y-0.5">
            {report.recommendations.map((r: any, i: number) => <li key={i}><strong>{r.action}</strong> <span className="text-gray-500">— {r.why}</span></li>)}</ol></div>
      )}
      {(report.data_gaps || []).length > 0 && (
        <div className="mt-3"><div className="text-xs font-semibold" style={{ color: '#b45309' }}>⚠ Data gaps</div>
          <ul className="list-disc ml-5 text-sm text-gray-600 mt-0.5">{report.data_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
      )}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <button onClick={save} disabled={busy === 'save' || saved} className="ai-plan-btn text-xs disabled:opacity-50">{saved ? '✓ Saved' : busy === 'save' ? 'Saving…' : '💾 Save'}</button>
        <button onClick={share} className="text-xs px-3 py-1.5 border border-gray-300 rounded">{copied ? '✓ Copied' : '🔗 Share'}</button>
        <button onClick={() => setRefineOpen((v) => !v)} className="text-xs px-3 py-1.5 border border-gray-300 rounded">✏️ Refine</button>
        {saved && <a href="/nexacore/ai/activity?tab=reports" className="text-xs underline" style={{ color: '#5147e6' }}>View in Reports →</a>}
      </div>
      {refineOpen && (
        <div className="mt-2 flex items-center gap-2">
          <input value={refineText} onChange={(e) => setRefineText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') refine(); }}
            placeholder="How should I refine it? e.g. “focus on quick wins, max 3 actions”"
            className="flex-1 text-sm px-3 py-2 rounded border border-gray-300" />
          <button onClick={refine} disabled={busy === 'refine'} className="ai-plan-btn text-xs disabled:opacity-50">{busy === 'refine' ? 'Refining…' : 'Go'}</button>
        </div>
      )}
    </div>
  );
}

function ApprovalsPanel({ pending, acting, onAct, onRefresh }:
  { pending: any[]; acting: string | null; onAct: (item: any, a: 'approve' | 'reject') => void; onRefresh: () => void }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-3 py-2.5 border-b border-gray-100 flex items-center justify-between">
        <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#5147e6' }}>
          Approvals
          {pending.length > 0 && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: '#dc2626', color: '#fff' }}>{pending.length}</span>}
        </span>
        <button onClick={onRefresh} className="text-[11px] underline text-gray-400">refresh</button>
      </div>
      {pending.length === 0 ? (
        <div className="px-3 py-8 text-center text-[12px] text-gray-400">Nothing to sign off. Anything your team wants to change will appear here.</div>
      ) : (
        <div className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
          {pending.map((it) => (
            <div key={it.id} className="px-3 py-2.5">
              <div className="text-[12px] font-semibold text-gray-800">{it.action}</div>
              <div className="text-[11px] text-gray-400">in {it.where}</div>
              {(it.fields || []).length > 0 ? (
                <div className="mt-1 rounded border border-gray-100 bg-gray-50 px-2 py-1.5 space-y-0.5">
                  {it.fields.map(([k, v]: any) => (
                    <div key={k} className="text-[11px]">
                      <span className="text-gray-400">{String(k).replace(/_/g, ' ')}: </span>
                      <span className="text-gray-700">{(typeof v === 'object' ? JSON.stringify(v) : String(v)).slice(0, 140)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-gray-600 mt-0.5">{it.note || 'Drafted change awaiting approval.'}</div>
              )}
              <div className="flex gap-2 mt-2">
                <button onClick={() => onAct(it, 'approve')} disabled={!!acting}
                  className="btn-approve text-[11px] font-semibold px-2.5 py-1 rounded disabled:opacity-50">{acting === it.id ? '…' : '✓ Approve'}</button>
                <button onClick={() => onAct(it, 'reject')} disabled={!!acting}
                  className="btn-reject text-[11px] px-2.5 py-1 rounded disabled:opacity-50">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
