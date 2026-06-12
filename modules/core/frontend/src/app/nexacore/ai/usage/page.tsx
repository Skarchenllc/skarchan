'use client';

import { useEffect, useState } from 'react';
import { StatCard, getJSON } from '@/components/ai/kit';

// Usage & Spend — the metering dashboard: budget, headline metrics, a 14-day
// spend trend, breakdowns by module / capability / model, latest insights, and
// the per-run ledger. All data comes from the ai_runs log via /ai/usage + /ai/runs.

const money = (n: number) => `$${Number(n || 0).toFixed(n >= 1 ? 2 : 4)}`;
const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n || 0);

interface Bucket { key: string; runs: number; cost_usd: number; tokens: number; errors: number }

// A ranked breakdown card with a cost bar per row.
function Breakdown({ title, rows, kind }: { title: string; rows: Bucket[]; kind: 'cost' | 'tokens' }) {
  const max = Math.max(1, ...rows.map((r) => (kind === 'cost' ? r.cost_usd : r.tokens)));
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-2" style={{ color: '#5147e6' }}>{title}</h3>
      {rows.length === 0 && <div className="text-xs text-gray-400 py-2">No data yet.</div>}
      <div className="space-y-1.5">
        {rows.slice(0, 8).map((r) => {
          const val = kind === 'cost' ? r.cost_usd : r.tokens;
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-gray-700 truncate" title={r.key}>{r.key}</span>
                <span className="text-gray-500 shrink-0 tabular-nums">
                  {kind === 'cost' ? money(r.cost_usd) : `${compact(r.tokens)} tok`}
                  <span className="text-gray-300"> · </span>
                  {r.runs} run{r.runs === 1 ? '' : 's'}
                  {r.errors > 0 && <span style={{ color: '#dc2626' }}> · {r.errors} err</span>}
                </span>
              </div>
              <div className="h-1.5 rounded-full mt-0.5" style={{ background: '#f1f5f9' }}>
                <div className="h-1.5 rounded-full" style={{ width: `${(val / max) * 100}%`, background: '#5147e6' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function UsagePage() {
  const [usage, setUsage] = useState<any>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [budget, setBudget] = useState<number>(0);

  useEffect(() => {
    getJSON('/api/v1/ai/usage').then(setUsage);
    getJSON('/api/v1/ai/runs?limit=25').then((r) => setRuns(r?.data || []));
    getJSON('/api/v1/ai/insights?limit=25').then((r) => setInsights(r?.data || []));
    getJSON('/api/v1/ai/status').then((s) => setBudget(Number(s?.governance?.monthly_budget_usd || s?.monthly_budget_usd || 0)));
  }, []);

  const runsN = usage?.runs ?? 0;
  const successRate = runsN ? Math.round((usage.success / runsN) * 100) : 0;
  const monthSpend = Number(usage?.month_spend_usd || 0);
  const budgetPct = budget > 0 ? Math.min(100, Math.round((monthSpend / budget) * 100)) : 0;
  const daily: { date: string; runs: number; cost_usd: number }[] = usage?.daily || [];
  const dayMax = Math.max(0.000001, ...daily.map((d) => d.cost_usd));

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Every AI call is metered to the run log. This is where the spend lands — track the monthly budget, see what each
        module, capability and model costs, and audit individual runs.
      </p>

      {/* Headline metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard label="Total runs" value={String(runsN)} sub={`${usage?.success ?? 0} ok · ${usage?.errors ?? 0} failed`} />
        <StatCard label="Success rate" value={`${successRate}%`} sub={runsN ? undefined : 'no runs yet'} />
        <StatCard label="Tokens (in / out)" value={`${compact(usage?.input_tokens)} / ${compact(usage?.output_tokens)}`} />
        <StatCard label="Avg latency" value={usage?.avg_latency_ms ? `${(usage.avg_latency_ms / 1000).toFixed(1)}s` : '—'} />
        <StatCard label="Total cost (all time)" value={money(usage?.cost_usd)} />
      </div>

      {/* Monthly budget */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold" style={{ color: '#5147e6' }}>Month-to-date spend</h3>
          <span className="text-xs text-gray-500">
            {money(monthSpend)}{budget > 0 ? <> of {money(budget)} budget · <strong style={{ color: budgetPct >= 90 ? '#dc2626' : '#374151' }}>{budgetPct}%</strong></> : <> · no budget cap set</>}
          </span>
        </div>
        {budget > 0 ? (
          <div className="h-2.5 rounded-full mt-2" style={{ background: '#f1f5f9' }}>
            <div className="h-2.5 rounded-full" style={{ width: `${budgetPct}%`, background: budgetPct >= 90 ? '#dc2626' : budgetPct >= 70 ? '#d97706' : '#01411C' }} />
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 mt-1">Set a monthly cap on the Governance page to track spend against a budget.</p>
        )}
      </div>

      {/* 14-day spend trend */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: '#5147e6' }}>Spend · last 14 days</h3>
        {daily.every((d) => d.cost_usd === 0) ? (
          <div className="text-xs text-gray-400 py-2">No spend in the last 14 days.</div>
        ) : (
          <div className="flex items-end gap-1.5" style={{ height: '120px' }}>
            {daily.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group">
                <div className="w-full rounded-t relative" title={`${d.date}: ${money(d.cost_usd)} · ${d.runs} runs`}
                  style={{ height: `${Math.max(d.cost_usd > 0 ? 4 : 0, (d.cost_usd / dayMax) * 100)}%`, background: '#1d4ed8', minHeight: d.cost_usd > 0 ? '3px' : '0' }} />
                <span className="text-[9px] text-gray-400 mt-1">{d.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Breakdown title="Cost by module" rows={usage?.by_module || []} kind="cost" />
        <Breakdown title="Cost by capability" rows={usage?.by_capability || []} kind="cost" />
        <Breakdown title="Tokens by model" rows={usage?.by_model || []} kind="tokens" />
      </div>

      {/* Latest insights */}
      {insights.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: '#5147e6' }}>Latest AI insights</h3>
          <div className="space-y-2">
            {insights.slice(0, 8).map((ins) => (
              <div key={ins.id} className="flex items-start gap-3 text-sm border-b border-gray-50 pb-2">
                <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded mt-0.5"
                  style={{
                    backgroundColor: ins.severity_max === 'high' ? '#fee2e2' : ins.severity_max === 'medium' ? '#fef3c7' : '#e5e7eb',
                    color: ins.severity_max === 'high' ? '#991b1b' : ins.severity_max === 'medium' ? '#92400e' : '#374151',
                  }}>
                  {ins.severity_max || 'none'}
                </span>
                <div>
                  <div className="text-gray-500 text-xs">
                    {ins.capability_id === 'manager_brief'
                      ? `${ins.module_code} · 🧭 manager briefing · ${(ins.priorities || []).length} priorities · ${(ins.findings || []).length} risks`
                      : `${ins.module_code}/${ins.entity_type} · ${ins.capability_id} · ${(ins.findings || []).length} findings`}
                  </div>
                  <div className="text-gray-800">{ins.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-run ledger */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-3 py-2 text-sm font-semibold border-b border-gray-100" style={{ color: '#5147e6' }}>
          Recent runs <span className="text-xs font-normal text-gray-400">· last {runs.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2">When</th>
                <th className="text-left px-3 py-2">Capability</th>
                <th className="text-left px-3 py-2">Module / Section</th>
                <th className="text-left px-3 py-2">Model</th>
                <th className="text-right px-3 py-2">Tokens</th>
                <th className="text-right px-3 py-2">Latency</th>
                <th className="text-right px-3 py-2">Cost</th>
                <th className="text-left px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {runs.length === 0 && (<tr><td colSpan={8} className="px-3 py-8 text-center text-gray-400">No runs yet.</td></tr>)}
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{(r.created_at || '').slice(0, 19).replace('T', ' ')}</td>
                  <td className="px-3 py-2 text-gray-800">{r.capability_id}</td>
                  <td className="px-3 py-2 text-gray-500">{r.module_code}/{r.entity_type}</td>
                  <td className="px-3 py-2 text-gray-500">{r.model}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{compact((r.input_tokens || 0) + (r.output_tokens || 0))}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-500">{r.latency_ms ? `${(r.latency_ms / 1000).toFixed(1)}s` : '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.cost_usd)}</td>
                  <td className="px-3 py-2">
                    <span title={r.error || undefined} style={{ color: r.status === 'success' ? '#059669' : '#dc2626', cursor: r.error ? 'help' : 'default' }}>
                      {r.status === 'success' ? '✓ success' : `✕ ${r.status}`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
