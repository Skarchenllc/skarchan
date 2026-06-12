'use client';

/**
 * BusinessOverview — the company-wide insight surface on the control-room home.
 * In one mount it pulls:
 *   • /development/entity-analytics  → count / $ / status per entity (Key Metrics)
 *   • /development/action-items      → cross-module "needs attention" feed
 *   • entity-records (ai_insights)   → AI narrative briefings
 * and renders three card grids: Needs Attention, Key Metrics, AI Insights.
 */

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import {
  TrendingUp, Receipt, ShoppingCart, Ticket, Users,
  Package, BadgeCheck, CheckSquare, ShieldAlert, ClipboardList,
  AlertTriangle, CheckCircle2, Sparkles, ArrowRight,
} from 'lucide-react';

interface Stat { count: number; amount: number; by_status: Record<string, number>; monthly?: any[] }
type StatsMap = Record<string, Stat>;
interface ActionItem {
  key: string; label: string; count: number; amount: number | null;
  severity: 'high' | 'medium' | 'low'; href: string;
}
interface Insight { title?: string; summary?: string; findings?: { title: string; section?: string; severity?: string }[] }

// Entity types queried for the metrics. Broad list → accurate counts.
const ALL_TYPES = [
  'opportunities', 'invoices', 'orders', 'support_tickets', 'employees',
  'leads', 'quotes', 'bills', 'contacts', 'sales_accounts',
];
const EMPTY: Stat = { count: 0, amount: 0, by_status: {} };

const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`;
const fmtMoney = (n: number) => `$${fmtCompact(n)}`;

// Design tokens (brand-adapted from the Skarchen dashboard design).
const C = {
  ink: '#000000', ink2: '#565a70', ink3: '#8b8fa6', line: '#e9eaf2', line2: '#f0f1f7', canvas: '#f5f6fb',
  brand: '#5147e6', brand50: '#eeedfd',
  red: '#d8453d', redBg: '#fdecea', amber: '#c97a06', amberBg: '#fbf0dd', green: '#119a66', greenBg: '#e6f5ee',
};
const SHADOW = '0 1px 2px rgba(20,22,40,.05), 0 10px 26px -18px rgba(20,22,40,.30)';
const cardStyle: React.CSSProperties = { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 13, boxShadow: SHADOW };

const openCount = (st: Stat) =>
  Object.entries(st.by_status)
    .filter(([k]) => !/(closed|resolved|complete|done|paid|cancel|won|lost)/.test(k.toLowerCase()))
    .reduce((a, [, v]) => a + v, 0);

const maxSeverity = (ins: Insight): 'high' | 'medium' | 'low' => {
  const sevs = (ins.findings || []).map((f) => (f.severity || '').toLowerCase());
  if (sevs.includes('high') || sevs.includes('critical')) return 'high';
  if (sevs.includes('medium')) return 'medium';
  return 'low';
};

// Derive a status tag + icon for a needs-attention card from its label.
function attnMeta(label: string, severity: string) {
  const l = label.toLowerCase();
  let tag = severity === 'high' ? 'Urgent' : 'Warning';
  if (/overdue/.test(l)) tag = 'Overdue';
  else if (/expir/.test(l)) tag = 'Expiring';
  else if (/low|out of|stock/.test(l)) tag = 'Low stock';
  else if (/non-?conform|conformance/.test(l)) tag = 'Critical';
  else if (/pending|review|draft/.test(l)) tag = 'Warning';
  let Icon = AlertTriangle;
  if (/invoice|bill|payment|receipt/.test(l)) Icon = Receipt;
  else if (/stock|item|inventor/.test(l)) Icon = Package;
  else if (/licen|certif/.test(l)) Icon = BadgeCheck;
  else if (/task/.test(l)) Icon = CheckSquare;
  else if (/conform|quality|inspect|risk/.test(l)) Icon = ShieldAlert;
  else if (/capa|corrective|action/.test(l)) Icon = ClipboardList;
  return { tag, Icon };
}

function SectionHead({ icon: Icon, title, count, link, iconBg, iconColor }: {
  icon: any; title: string; count?: string; link?: { label: string; href: string }; iconBg?: string; iconColor?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 mb-3.5">
      <span className="inline-flex items-center justify-center rounded-lg"
            style={{ width: 30, height: 30, background: iconBg || C.brand50, color: iconColor || C.brand }}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="font-display" style={{ fontSize: '1.12rem', fontWeight: 700, color: C.ink }}>{title}</div>
      {count && <span style={{ fontSize: '0.82rem', color: C.ink3, fontWeight: 500 }}>{count}</span>}
      {link && (
        <a href={link.href} className="ml-auto inline-flex items-center gap-1.5"
           style={{ fontSize: '0.85rem', fontWeight: 600, color: C.brand }}>
          {link.label} <ArrowRight className="w-3.5 h-3.5" />
        </a>
      )}
    </div>
  );
}

export default function BusinessOverview() {
  const [stats, setStats] = useState<StatsMap | null>(null);
  const [actions, setActions] = useState<ActionItem[] | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [statsRes, actionsRes, insightsRes] = await Promise.allSettled([
        api.get(`/api/v1/development/entity-analytics?entity_types=${ALL_TYPES.join(',')}`),
        api.get(`/api/v1/development/action-items`),
        api.get(`/api/v1/development/entity-records?entity_type=ai_insights&limit=6`),
      ]);
      if (cancelled) return;
      setStats(statsRes.status === 'fulfilled' ? (statsRes.value.data?.data || {}) : {});
      setActions(actionsRes.status === 'fulfilled' ? (actionsRes.value.data?.data || []) : []);
      const recs = insightsRes.status === 'fulfilled' ? (insightsRes.value.data?.data || insightsRes.value.data || []) : [];
      setInsights(recs.map((r: any) => r.data || r).filter((d: any) => d && (d.summary || d.findings)));
    })();
    return () => { cancelled = true; };
  }, []);

  const S = (t: string): Stat => (stats?.[t]) || EMPTY;

  const metrics = useMemo(() => {
    if (!stats) return null;
    const opp = S('opportunities'), inv = S('invoices'), ord = S('orders'), tic = S('support_tickets'), emp = S('employees');
    const open = openCount(tic);
    return [
      { icon: TrendingUp, label: 'Pipeline Value', value: fmtMoney(opp.amount), sub: `${opp.count} open opportunities` },
      { icon: Receipt, label: 'Invoiced', value: fmtMoney(inv.amount), sub: `${inv.count} invoices issued` },
      { icon: ShoppingCart, label: 'Orders', value: `${ord.count}`, sub: `${fmtMoney(ord.amount)} order value` },
      { icon: Ticket, label: 'Open Tickets', value: `${open}`, sub: `of ${tic.count} total tickets`, bar: tic.count > 0 ? Math.round((open / tic.count) * 100) : 0 },
      { icon: Users, label: 'Headcount', value: `${emp.count}`, sub: 'active employees' },
    ];
  }, [stats]);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 rounded-xl bg-gray-100 animate-pulse" />)}
      </div>
    );
  }

  const sevColor = (s: string) => (s === 'high' ? { fg: C.red, bg: C.redBg } : { fg: C.amber, bg: C.amberBg });

  return (
    <div className="space-y-7">
      {/* NEEDS ATTENTION */}
      {actions !== null && (
        <div>
          <SectionHead icon={AlertTriangle} title="Needs Attention"
            count={actions.length > 0 ? `${actions.length} ${actions.length === 1 ? 'area' : 'areas'} flagged` : undefined}
            link={actions.length > 0 ? { label: 'View all', href: '/nexacore/ai/activity' } : undefined}
            iconBg={C.redBg} iconColor={C.red} />
          {actions.length === 0 ? (
            <div className="rounded-xl p-5 flex items-center gap-2.5"
                 style={{ ...cardStyle, background: 'linear-gradient(180deg,#f4fbf7,#fff)', borderColor: '#d6efe2' }}>
              <CheckCircle2 className="w-5 h-5" style={{ color: C.green }} />
              <span className="text-sm font-semibold" style={{ color: C.green }}>All clear — nothing needs attention right now.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {actions.map((a) => {
                const col = sevColor(a.severity);
                const { tag, Icon } = attnMeta(a.label, a.severity);
                return (
                  <a key={a.key} href={a.href} className="flex flex-col p-4 transition-all hover:-translate-y-0.5"
                     style={{ ...cardStyle, minHeight: 116 }}>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: col.bg, color: col.fg }}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, color: col.fg, background: col.bg }}>{tag}</span>
                    </div>
                    <div className="tabular-nums font-display" style={{ fontSize: '1.85rem', fontWeight: 700, lineHeight: 1, marginTop: 14, color: col.fg }}>{a.count}</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, marginTop: 7 }}>{a.label}</div>
                    <div className="tabular-nums" style={{ fontSize: '0.78rem', color: C.ink3, marginTop: 2 }}>
                      {a.amount != null && a.amount > 0 ? `${fmtMoney(a.amount)} outstanding` : ''}
                    </div>
                  </a>
                );
              })}
              {/* All-clear card */}
              <div className="flex flex-col p-4" style={{ ...cardStyle, background: 'linear-gradient(180deg,#f4fbf7,#fff)', borderColor: '#d6efe2', minHeight: 116 }}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: C.greenBg, color: C.green }}>
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, color: C.green, background: C.greenBg }}>On track</span>
                </div>
                <div className="font-display" style={{ fontSize: '1.85rem', fontWeight: 700, lineHeight: 1, marginTop: 14, color: C.green }}>✓</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: C.ink, marginTop: 7 }}>Everything else is clear</div>
                <div style={{ fontSize: '0.78rem', color: C.ink3, marginTop: 2 }}>No action needed</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KEY METRICS */}
      {metrics && (
        <div>
          <SectionHead icon={TrendingUp} title="Key Metrics" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {metrics.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.label} className="p-4.5 transition-all hover:-translate-y-0.5" style={{ ...cardStyle, padding: 18 }}>
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: '0.66rem', letterSpacing: '0.09em', textTransform: 'uppercase', color: C.ink3, fontWeight: 600 }}>{m.label}</span>
                    <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, background: C.canvas, color: C.ink2 }}>
                      <Icon className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="tabular-nums font-display" style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.01em', margin: '14px 0 4px', color: C.ink }}>{m.value}</div>
                  <div style={{ fontSize: '0.78rem', color: C.ink3 }}>{m.sub}</div>
                  {'bar' in m && m.bar !== undefined && (
                    <div style={{ height: 6, borderRadius: 4, background: C.line2, marginTop: 12, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${m.bar}%`, borderRadius: 4, background: `linear-gradient(90deg, ${C.brand}, #8a7bf5)` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI INSIGHTS */}
      {insights !== null && insights.length > 0 && (
        <div>
          <SectionHead icon={Sparkles} title="AI Insights" iconBg="#efeafe" iconColor={C.brand}
            link={{ label: 'Open AI Center', href: '/nexacore/ai' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {insights.slice(0, 3).map((ins, i) => {
              const sev = maxSeverity(ins);
              const col = sev === 'high' ? { fg: C.red, bg: C.redBg } : sev === 'medium' ? { fg: C.amber, bg: C.amberBg } : { fg: C.brand, bg: C.brand50 };
              const sevLabel = sev === 'high' ? 'High' : sev === 'medium' ? 'Medium' : 'Low';
              const total = (ins.findings || []).length;
              const high = (ins.findings || []).filter((f) => /(high|critical)/i.test(f.severity || '')).length;
              const title = ins.title || (ins.findings || [])[0]?.title || 'AI briefing';
              return (
                <div key={i} className="flex flex-col p-5 transition-all hover:-translate-y-0.5" style={cardStyle}>
                  <div className="flex items-center gap-2.5 whitespace-nowrap">
                    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, color: col.fg, background: col.bg }}>{sevLabel}</span>
                    <span style={{ fontSize: '0.75rem', color: C.ink3, fontWeight: 500 }}>
                      {total} {total === 1 ? 'finding' : 'findings'}{high ? ` · ${high} high` : ''}
                    </span>
                  </div>
                  <div className="font-display" style={{ fontSize: '0.95rem', fontWeight: 700, margin: '13px 0 7px', color: C.ink, letterSpacing: '-0.005em' }}>{title}</div>
                  <p className="flex-1" style={{ fontSize: '0.85rem', color: C.ink2, lineHeight: 1.55 }}>{ins.summary || (ins.findings || [])[0]?.title}</p>
                  <a href="/nexacore/ai" className="inline-flex items-center gap-1.5"
                     style={{ marginTop: 15, paddingTop: 13, borderTop: `1px solid ${C.line2}`, fontSize: '0.82rem', fontWeight: 600, color: C.brand }}>
                    Review findings <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
