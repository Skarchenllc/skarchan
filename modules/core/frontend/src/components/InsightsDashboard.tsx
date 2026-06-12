'use client';

import { useCallback, useEffect, useState } from 'react';

const money = (v: any) => (Number(v) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const STAGE_COLOR = ['#94a3b8', '#60a5fa', '#3b82f6', '#7c3aed', '#01411C'];

// Per-module entity tiles (transferred from the nexacore control room) — label,
// entity_type and the page each links to.
const ENTITIES: Record<'sales' | 'marketing', { label: string; entityType: string; href: string }[]> = {
  sales: [
    { label: 'Organizations', entityType: 'sales_accounts', href: '/contacts/organizations' },
    { label: 'Contacts', entityType: 'contacts', href: '/contacts/contacts' },
    { label: 'Customers', entityType: 'customers', href: '/sales/customers' },
    { label: 'Products', entityType: 'sales_products', href: '/sales/products' },
    { label: 'Opportunities', entityType: 'opportunities', href: '/sales/opportunities' },
    { label: 'Quotes', entityType: 'quotes', href: '/sales/quotes' },
    { label: 'Orders', entityType: 'orders', href: '/sales/orders' },
    { label: 'Activities', entityType: 'activities', href: '/sales/activities' },
  ],
  marketing: [
    { label: 'Forms', entityType: 'forms', href: '/marketing/forms' },
    { label: 'Form Submissions', entityType: 'form_submissions', href: '/marketing/form-submissions' },
    { label: 'Leads', entityType: 'leads', href: '/marketing/leads' },
    { label: 'Lead Activities', entityType: 'lead_activities', href: '/marketing/lead-activities' },
    { label: 'Score Events', entityType: 'lead_score_events', href: '/marketing/lead-scoring' },
    { label: 'Campaigns', entityType: 'campaigns', href: '/marketing/campaigns' },
    { label: 'Campaign Activities', entityType: 'campaign_activities', href: '/marketing/campaign-activities' },
    { label: 'Campaign Metrics', entityType: 'campaign_metrics', href: '/marketing/campaign-metrics' },
    { label: 'Content', entityType: 'contents', href: '/marketing/content' },
    { label: 'Segments', entityType: 'segments', href: '/marketing/segments' },
    { label: 'Lists', entityType: 'lists', href: '/marketing/lists' },
    { label: 'Journeys', entityType: 'journeys', href: '/marketing/journeys' },
    { label: 'Enrollments', entityType: 'journey_enrollments', href: '/marketing/journey-enrollments' },
    { label: 'Email Templates', entityType: 'marketing_email_templates', href: '/marketing/email-templates' },
    { label: 'Email Sends', entityType: 'email_sends', href: '/marketing/email-sends' },
    { label: 'Web Analytics', entityType: 'website_analytics', href: '/marketing/website-analytics' },
  ],
};

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-bold text-gray-900 mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <div className="text-[11px] text-gray-400 h-9 flex items-center">Not enough history yet</div>;
  const w = 140, h = 36, min = Math.min(...values), max = Math.max(...values), span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 4) - 2}`).join(' ');
  return (
    <svg width={w} height={h} className="mt-1">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - ((values[values.length - 1] - min) / span) * (h - 4) - 2} r={2.5} fill={color} />
    </svg>
  );
}

function Trend({ label, values, color, fmt }: { label: string; values: number[]; color: string; fmt: (v: any) => string }) {
  const last = values.length ? values[values.length - 1] : 0;
  const delta = values.length ? last - values[0] : 0;
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{label}</span>
        {values.length >= 2 && (
          <span className="text-[11px] font-semibold" style={{ color: delta >= 0 ? '#01411C' : '#dc2626' }}>
            {delta >= 0 ? '▲' : '▼'} {fmt(Math.abs(delta))}
          </span>
        )}
      </div>
      <div className="text-lg font-bold text-gray-900">{fmt(last)}</div>
      <Sparkline values={values} color={color} />
    </div>
  );
}

function ReasonBars({ rows, color, max }: { rows: any[]; color: string; max: number }) {
  if (!rows.length) return <div className="text-xs text-gray-400">No data yet.</div>;
  return (
    <div className="space-y-1.5">
      {rows.map((r: any) => (
        <div key={r.reason} className="flex items-center gap-2">
          <div className="w-28 text-xs text-gray-600 truncate text-right shrink-0">{r.reason}</div>
          <div className="flex-1 bg-gray-100 rounded h-5 overflow-hidden">
            <div className="h-5 rounded" style={{ width: `${Math.max(6, 100 * r.count / (max || 1))}%`, background: color }} />
          </div>
          <div className="w-24 text-xs text-gray-500 shrink-0">{r.count} · {money(r.value)}</div>
        </div>
      ))}
    </div>
  );
}

export default function InsightsDashboard({ scope }: { scope: 'sales' | 'marketing' }) {
  const [f, setF] = useState<any>(null);
  const [snaps, setSnaps] = useState<any[]>([]);
  const [wl, setWl] = useState<any>(null);
  const [attr, setAttr] = useState<any>(null);
  const [ents, setEnts] = useState<Record<string, any>>({});
  const [snapping, setSnapping] = useState(false);

  const load = useCallback(async () => {
    const types = ENTITIES[scope].map(e => e.entityType).join(',');
    const j = async (url: string, fb: any) => {
      try { const r = await fetch(url); return r.ok ? await r.json() : fb; } catch { return fb; }
    };
    const [funnel, trend, winloss, attribution, entityStats] = await Promise.all([
      j('/api/v1/analytics/funnel', null),
      j('/api/v1/analytics/trend?days=30', { snapshots: [] }),
      j('/api/v1/analytics/win-loss', null),
      j('/api/v1/analytics/attribution', null),
      j(`/api/v1/development/entity-analytics?entity_types=${types}`, { data: {} }),
    ]);
    // Only accept a funnel with the expected shape — guards against 401/404/error bodies.
    setF(funnel && funnel.lifecycle && funnel.conversions ? funnel : null);
    setSnaps(trend?.snapshots || []); setWl(winloss); setAttr(attribution);
    setEnts(entityStats?.data || {});
  }, [scope]);
  useEffect(() => { load(); }, [load]);

  async function snapshotNow() {
    setSnapping(true);
    try { await fetch('/api/v1/analytics/snapshot', { method: 'POST' }); await load(); }
    finally { setSnapping(false); }
  }

  const m = f?.marketing, s = f?.sales, c = f?.conversions;
  const series = (k: string) => snaps.map(x => Number(x[k]) || 0);
  const isSales = scope === 'sales';
  const ready = !!(f && f.lifecycle && f.conversions && f.marketing && f.sales);

  return (
    <div className="space-y-6 mt-2">
      {/* Module entities (transferred from the nexacore control room) */}
      <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
        <h2 className="text-sm font-semibold text-gray-800 mb-3">{isSales ? 'Sales' : 'Marketing'} Entities</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-3">
          {ENTITIES[scope].map(e => {
            const st = ents[e.entityType] || { count: 0, amount: 0, by_status: {} };
            return (
              <a key={e.entityType} href={e.href}
                 title={Object.entries(st.by_status || {}).map(([k, v]) => `${k}: ${v}`).join('  •  ')}
                 className="group block">
                <div className="text-xs text-gray-500 group-hover:text-blue-700 truncate transition-colors">{e.label}</div>
                <div className="mt-0.5 flex items-baseline gap-1.5">
                  <span className="text-sm font-medium text-gray-800 tabular-nums">{st.count ?? 0}</span>
                  {st.amount > 0 && <span className="text-xs text-emerald-600 tabular-nums">{money(st.amount)}</span>}
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Lifecycle funnel + analytics — only when the funnel data is valid */}
      {ready ? (<>
      <div className="bg-white rounded-lg p-5 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-gray-800">Marketing → Sales Lifecycle</h2>
          <button onClick={snapshotNow} disabled={snapping}
            className="text-xs font-semibold px-2 py-1 disabled:opacity-50" style={{ border: '1px solid #0ea5e9', color: '#0ea5e9' }}>
            {snapping ? 'Saving…' : '+ Snapshot now'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-4">{c.lead_to_won_pct}% of leads become won deals · {money(s.won_revenue)} won revenue</p>
        <div className="space-y-2">
          {f.lifecycle.map((st: any, i: number) => (
            <div key={st.stage} className="flex items-center gap-3">
              <div className="w-36 text-xs text-gray-600 text-right shrink-0">{st.stage}</div>
              <div className="flex-1 bg-gray-100 rounded h-7 relative overflow-hidden">
                <div className="h-7 rounded flex items-center px-2 text-xs font-semibold text-white"
                     style={{ width: `${Math.max(6, st.conv_from_top)}%`, background: STAGE_COLOR[i] }}>{st.count}</div>
              </div>
              <div className="w-32 text-xs text-gray-500 shrink-0">
                {i > 0 && <span>{st.conv_from_prev}% of prev</span>}
                {st.value != null && st.value > 0 && <span className="ml-1 text-gray-700 font-medium">{money(st.value)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SALES scope */}
      {isSales && <>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Sales Trends</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Trend label="Won Revenue" values={series('won_revenue')} color="#01411C" fmt={money} />
            <Trend label="Win Rate" values={series('win_rate')} color="#7c3aed" fmt={v => `${Math.round(v)}%`} />
            <Trend label="Open Pipeline" values={series('open_pipeline')} color="#0ea5e9" fmt={money} />
            <Trend label="Leads" values={series('leads')} color="#3b82f6" fmt={v => String(Math.round(v))} />
          </div>
        </div>
        {wl && (wl.won_count > 0 || wl.lost_count > 0) && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Why we win <span className="text-xs text-gray-400">· {wl.won_count} · {money(wl.won_value)}</span></h3>
              <ReasonBars rows={wl.won} color="#01411C" max={Math.max(...wl.won.map((r: any) => r.count), ...wl.lost.map((r: any) => r.count), 1)} />
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Why we lose <span className="text-xs text-gray-400">· {wl.lost_count} · {money(wl.lost_value)}</span></h3>
              <ReasonBars rows={wl.lost} color="#dc2626" max={Math.max(...wl.won.map((r: any) => r.count), ...wl.lost.map((r: any) => r.count), 1)} />
            </div>
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Sales</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card label="Open Pipeline" value={money(s.open_pipeline)} sub={`${s.open} open deals`} />
            <Card label="Won Revenue" value={money(s.won_revenue)} sub={`${s.won} won · avg ${money(s.avg_won_deal)}`} />
            <Card label="Win Rate" value={`${s.win_rate}%`} sub={`${s.won} won / ${s.lost} lost`} />
            <Card label="Quotes / Orders" value={money(s.quotes_value + s.orders_value)} sub={`${s.quotes} quotes · ${s.orders} orders`} />
          </div>
        </div>
      </>}

      {/* MARKETING scope */}
      {!isSales && <>
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Conversion Rates Over Time</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Trend label="Lead → MQL" values={series('conv_lead_mql')} color="#60a5fa" fmt={v => `${Math.round(v)}%`} />
            <Trend label="MQL → SQL" values={series('conv_mql_sql')} color="#3b82f6" fmt={v => `${Math.round(v)}%`} />
            <Trend label="SQL → Won" values={series('conv_sql_won')} color="#01411C" fmt={v => `${Math.round(v)}%`} />
            <Trend label="Leads" values={series('leads')} color="#7c3aed" fmt={v => String(Math.round(v))} />
          </div>
        </div>
        {attr && attr.campaigns?.length > 0 && (
          <div className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Campaign Attribution <span className="text-xs text-gray-400">· won revenue by sourcing campaign</span></h3>
            <ReasonBars
              rows={attr.campaigns.map((cp: any) => ({ reason: cp.campaign, count: cp.won_deals, value: cp.won_revenue })).sort((a: any, b: any) => b.value - a.value)}
              color="#0ea5e9" max={Math.max(...attr.campaigns.map((cp: any) => cp.won_deals), 1)} />
            <div className="text-xs text-gray-400 mt-2">{attr.total_leads} leads · {money(attr.total_won_revenue)} attributed won revenue</div>
          </div>
        )}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Marketing</h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            <Card label="Leads" value={String(m.leads)} sub={`${m.hot} hot · ${m.warm} warm · ${m.cold} cold`} />
            <Card label="Lead → MQL → SQL" value={`${m.lead_to_mql_pct}% → ${m.lead_to_sql_pct}%`} sub={`${m.mql} MQL · ${m.qualified} qualified`} />
            <Card label="Email Engagement" value={`${m.open_rate}% open`} sub={`${m.click_rate}% click · ${m.email_sends} sent`} />
            <Card label="Capture & Nurture" value={`${m.form_submissions} forms`} sub={`${m.journeys_active} active · ${m.journeys_completed} done journeys`} />
          </div>
        </div>
      </>}
      </>) : (
        <div className="text-sm text-gray-400 py-4 text-center">Funnel analytics will appear once the backend is updated &amp; reachable.</div>
      )}
    </div>
  );
}
