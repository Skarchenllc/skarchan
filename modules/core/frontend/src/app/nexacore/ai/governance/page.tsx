'use client';

import { useEffect, useState } from 'react';
import { Toggle, authHeaders, getJSON } from '@/components/ai/kit';

// Governance — the global guardrails: master switch, monthly budget, who can
// write/approve, and the confidence×risk routing policy.
export default function GovernancePage() {
  const [status, setStatus] = useState<any>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [err, setErr] = useState<string | null>(null);
  // Daily standup (folded in from the retired Org page).
  const [standup, setStandup] = useState<any>(null);
  const [standupEdit, setStandupEdit] = useState(false);
  const [standupMsg, setStandupMsg] = useState<string | null>(null);
  const [standupBusy, setStandupBusy] = useState(false);

  const load = async () => {
    const st = await getJSON('/api/v1/ai/status');
    setStatus(st);
    setBudgetInput(String(st?.governance?.monthly_budget_usd ?? 0));
    setStandup(st?.governance?.ceo_standup || null);
  };
  useEffect(() => { load(); }, []);

  const saveStandup = async (patch: any) => {
    setStandup((s: any) => ({ ...s, ...patch }));
    const r = await fetch('/api/v1/ai/ceo-standup', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(patch) });
    if (r.ok) setStandup(await r.json());
    else setStandupMsg('Not allowed — sign in as an admin to change the schedule.');
  };
  const runStandupNow = async () => {
    setStandupBusy(true); setStandupMsg(null);
    try {
      const r = await fetch('/api/v1/ai/ceo-standup/run', { method: 'POST', headers: authHeaders() }).then((x) => x.json());
      setStandupMsg(r.error ? r.error : `Standup done — ${r.pending || 0} item${r.pending === 1 ? '' : 's'} queued, $${r.cost_usd}. See Approvals.`);
    } catch { setStandupMsg('Standup failed.'); } finally { setStandupBusy(false); }
  };

  const guard = async (r: Response) => {
    if (!r.ok) { setErr(r.status === 401 || r.status === 403 ? 'Not allowed — sign in as an admin.' : `Save failed (${r.status}).`); return null; }
    setErr(null); return r.json();
  };
  const saveBudget = async (enabled: boolean, budget: number) => {
    const r = await fetch('/api/v1/ai/budget', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ enabled, monthly_budget_usd: budget }) });
    const gov = await guard(r);
    if (gov) setStatus((p: any) => ({ ...p, governance: { ...p.governance, ...gov } }));
  };
  const saveAccess = async (patch: any) => {
    const r = await fetch('/api/v1/ai/access', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(patch) });
    const acc = await guard(r);
    if (acc) setStatus((p: any) => ({ ...p, access: { writes_require: acc.writes_require, approvals_require: acc.approvals_require } }));
  };
  const savePolicy = async (mode: string) => {
    const r = await fetch('/api/v1/ai/policy', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ policy_mode: mode }) });
    const g = await guard(r);
    if (g) setStatus((p: any) => ({ ...p, policy: { mode: g.policy_mode } }));
  };
  const saveJobsAuto = async (enabled: boolean) => {
    const r = await fetch('/api/v1/ai/jobs-auto', { method: 'PUT', headers: authHeaders(), body: JSON.stringify({ enabled }) });
    const g = await guard(r);
    if (g) setStatus((p: any) => ({ ...p, governance: { ...p.governance, jobs_auto: g.ai_jobs_auto } }));
  };

  return (
    <div className="space-y-4">
      {err && <div className="px-3 py-2 text-sm rounded border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{err}</div>}

      {/* Master switch + budget */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>AI master switch</span>
            <Toggle on={!!status?.governance?.enabled}
              onClick={() => saveBudget(!status?.governance?.enabled, status?.governance?.monthly_budget_usd ?? 0)} />
            <span className="text-xs text-gray-400">{status?.governance?.enabled ? 'AI is on globally' : 'All AI is paused'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Monthly budget $</span>
            <input type="number" min={0} step={1} value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded" placeholder="0 = ∞" />
            <button onClick={() => saveBudget(!!status?.governance?.enabled, parseFloat(budgetInput) || 0)} className="ai-plan-btn text-xs">Save</button>
            <span className="text-xs text-gray-400">spent ${(status?.governance?.month_spend_usd ?? 0).toFixed(4)} this month</span>
          </div>
        </div>
      </div>

      {/* Automatic AI jobs */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>Process AI jobs automatically</span>
          <Toggle on={!!status?.governance?.jobs_auto} onClick={() => saveJobsAuto(!status?.governance?.jobs_auto)} />
          <span className="text-xs text-gray-400">
            {status?.governance?.jobs_auto
              ? 'The scheduler drains the AI job queue every minute.'
              : 'Off — AI-run automations queue up but only run when you press “Run queue” on AI Jobs.'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          When an automation’s <code>ai_run</code> action fires it enqueues an AI job. With this on, the background
          scheduler runs those jobs and applies the confidence × risk policy without anyone pressing a button.
          It spends API budget, so it’s off by default.
        </p>
      </div>

      {/* Daily standup */}
      {standup && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>Daily standup</span>
            <Toggle on={!!standup.enabled} onClick={() => saveStandup({ enabled: !standup.enabled })} />
            <span className="text-xs text-gray-400">the CEO runs the standing instruction every</span>
            <input type="number" min={1} value={standup.interval_hours || 24}
              onChange={(e) => setStandup((s: any) => ({ ...s, interval_hours: e.target.value }))}
              onBlur={(e) => saveStandup({ interval_hours: parseFloat(e.target.value) || 24 })}
              className="w-12 px-1 py-0.5 rounded border border-gray-300 text-gray-800 text-sm" />
            <span className="text-xs text-gray-400">h</span>
            <button onClick={() => setStandupEdit((v) => !v)} className="text-xs underline" style={{ color: '#5147e6' }}>edit instruction</button>
            <button onClick={runStandupNow} disabled={standupBusy} className="ml-auto ai-plan-btn text-xs disabled:opacity-50">
              {standupBusy ? 'Running…' : 'Run now'}
            </button>
          </div>
          {standupEdit && (
            <div className="mt-2 flex gap-1">
              <input value={standup.instruction || ''} onChange={(e) => setStandup((s: any) => ({ ...s, instruction: e.target.value }))}
                className="flex-1 text-sm px-2 py-1 rounded border border-gray-300 text-gray-800" />
              <button onClick={() => { saveStandup({ instruction: standup.instruction }); setStandupEdit(false); }} className="ai-plan-btn text-xs">Save</button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            On this schedule, the CEO convenes the department heads, each surfaces their team’s most urgent risks, and
            anything they want to act on lands in <a className="underline" href="/nexacore/ai/review">Approvals</a>. It spends API budget, so it’s off by default.
          </p>
          {standupMsg && <div className="text-xs text-gray-500 mt-1">{standupMsg}</div>}
        </div>
      )}

      {/* Access control */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>Access control</span>
          <span className="text-xs text-gray-400">
            {status?.me?.authenticated ? `Signed in as ${status.me.email}${status.me.is_admin ? ' · admin' : ''}` : 'Not signed in'}
          </span>
        </div>
        <div className="grid md:grid-cols-2 gap-3 mt-3 text-sm">
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Who can create/update records</span>
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={status?.access?.writes_require || 'any_user'}
              onChange={(e) => saveAccess({ writes_require: e.target.value })}>
              <option value="any_user">Any signed-in user</option>
              <option value="admin">Admins only</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-2">
            <span className="text-gray-600">Who can approve changes &amp; manage AI</span>
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={status?.access?.approvals_require || 'admin'}
              onChange={(e) => saveAccess({ approvals_require: e.target.value })}>
              <option value="any_user">Any signed-in user</option>
              <option value="admin">Admins only</option>
            </select>
          </label>
        </div>
      </div>

      {/* AI action policy */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm font-semibold" style={{ color: '#5147e6' }}>AI action policy</span>
          <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={status?.policy?.mode || 'trust'}
            onChange={(e) => savePolicy(e.target.value)}>
            <option value="trust">Trust (confidence × risk)</option>
            <option value="review_all">Review everything</option>
            <option value="auto_all">Auto-apply everything</option>
          </select>
        </div>
        <p className="text-xs text-gray-500 mt-2">How AI-driven automation actions (<code>ai_run</code> jobs) are routed before they apply:</p>
        <ul className="text-xs text-gray-500 mt-1 space-y-0.5">
          <li><strong>Trust</strong> — a worker/capability's <em>autonomy</em> × the action's <em>risk</em> decides auto vs. review vs. block (high-risk always reviews; <em>suggest</em> autonomy never auto-applies).</li>
          <li><strong>Review everything</strong> — every AI write waits for human approval (max human-in-loop).</li>
          <li><strong>Auto-apply everything</strong> — governance gate off; AI actions apply immediately (still logged &amp; reversible in the ledger).</li>
        </ul>
        <p className="text-xs text-gray-400 mt-2">Pending actions appear in <a className="underline" href="/nexacore/automation/ai-jobs">Automation › AI Jobs</a> for Approve / Reject.</p>
      </div>
    </div>
  );
}
