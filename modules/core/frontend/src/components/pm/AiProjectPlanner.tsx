'use client';

/**
 * AI Auto-Planner — draft → review → apply.
 * 1. "Generate" drafts a plan via /api/v1/pm/auto-plan/preview (no writes).
 * 2. The user reviews the proposed project / milestones / tasks.
 * 3. "Create project" persists it via /api/v1/pm/auto-plan/apply (no second
 *    model call), then reloads so the list + dashboard update.
 */

import React, { useMemo, useState } from 'react';
import { Sparkles, X, ArrowLeft } from 'lucide-react';

interface Plan {
  project_name: string;
  description: string;
  priority: string;
  start_date: string;
  end_date: string;
  estimated_budget: number;
  milestones: { milestone_name: string; due_date: string }[];
  tasks: { task_name: string; milestone_index: number; priority: string }[];
}

export default function AiProjectPlanner() {
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState('');
  const [plan, setPlan] = useState<Plan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ name: string; m: number; t: number } | null>(null);

  const busy = generating || applying;

  const close = () => {
    if (busy) return;
    setOpen(false); setError(null); setPlan(null); setDone(null);
  };
  const back = () => { setPlan(null); setError(null); };

  const tasksPerMilestone = useMemo(() => {
    const counts: Record<number, number> = {};
    (plan?.tasks || []).forEach((t) => { counts[t.milestone_index] = (counts[t.milestone_index] || 0) + 1; });
    return counts;
  }, [plan]);

  const generate = async () => {
    if (brief.trim().length < 10) { setError('Please describe the project in at least a sentence.'); return; }
    setGenerating(true); setError(null);
    try {
      const r = await fetch('/api/v1/pm/auto-plan/preview', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim() }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.detail || `Request failed (${r.status})`);
      setPlan(body.plan as Plan);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  const apply = async () => {
    if (!plan) return;
    setApplying(true); setError(null);
    try {
      const r = await fetch('/api/v1/pm/auto-plan/apply', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(body?.detail || `Request failed (${r.status})`);
      setDone({ name: body.project_name, m: body.counts?.milestones ?? 0, t: body.counts?.tasks ?? 0 });
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      setError(e?.message || 'Something went wrong.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="ai-plan-btn inline-flex items-center gap-2 text-sm"
        title="Describe a project and let AI draft the milestones and tasks">
        <Sparkles className="w-4 h-4" /> AI Auto-Plan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={close}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold inline-flex items-center gap-2" style={{ color: '#5147e6' }}>
                <Sparkles className="w-5 h-5" /> AI Project Auto-Planner
              </h3>
              <button type="button" onClick={close} aria-label="Close" className="text-gray-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="px-6 py-5 space-y-3 overflow-auto">
              {/* Step 1 — brief */}
              {!plan && !done && (
                <>
                  <label className="block text-sm font-medium text-gray-700">Describe the project</label>
                  <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5} disabled={generating}
                    placeholder="e.g. Launch a customer feedback portal: SSO login, an admin dashboard with charts, weekly email digests, and a public roadmap. Target launch in 10 weeks, small engineering team."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded" />
                  <p className="text-xs text-gray-500">You'll review the drafted plan before anything is saved.</p>
                </>
              )}

              {/* Step 2 — review the draft */}
              {plan && !done && (
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-wide text-gray-400">Draft — nothing saved yet</div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{plan.project_name}</div>
                    <div className="text-sm text-gray-600">{plan.description}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Priority {plan.priority} · {plan.start_date} → {plan.end_date} · budget ${Number(plan.estimated_budget || 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {plan.milestones.length} milestones · {plan.tasks.length} tasks
                  </div>
                  <ol className="space-y-1">
                    {plan.milestones.map((m, i) => (
                      <li key={i} className="flex items-center justify-between text-sm border border-gray-100 rounded px-3 py-2">
                        <span><span className="text-gray-400 mr-2">M{i + 1}</span>{m.milestone_name}</span>
                        <span className="text-xs text-gray-400">{m.due_date} · {tasksPerMilestone[i] || 0} tasks</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Step 3 — done */}
              {done && (
                <div className="p-4 text-sm rounded border" style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }}>
                  <p className="font-semibold">Created “{done.name}”.</p>
                  <p className="mt-1">{done.m} milestones and {done.t} tasks added. Refreshing…</p>
                </div>
              )}

              {error && <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>}
            </div>

            {!done && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
                <div>
                  {plan && (
                    <button type="button" onClick={back} disabled={busy} className="text-sm inline-flex items-center gap-1 px-2 py-1.5">
                      <ArrowLeft className="w-4 h-4" /> Edit brief
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={close} disabled={busy} className="text-sm px-3 py-1.5">Cancel</button>
                  {!plan ? (
                    <button type="button" onClick={generate} disabled={busy} className="ai-plan-btn inline-flex items-center gap-2 text-sm disabled:opacity-60">
                      <Sparkles className="w-4 h-4" /> {generating ? 'Drafting plan…' : 'Generate plan'}
                    </button>
                  ) : (
                    <button type="button" onClick={apply} disabled={busy} className="ai-plan-btn inline-flex items-center gap-2 text-sm disabled:opacity-60">
                      {applying ? 'Creating…' : 'Create project'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
