'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import BusinessOverview from '@/components/BusinessOverview';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  FiBarChart2, FiFileText, FiGrid, FiZap, FiArrowRight, FiChevronDown,
} from 'react-icons/fi';

interface ModuleStat { records: number; amount: number; last_activity: string | null }

const fmtCompact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : `${n}`;
const fmtMoney = (n: number) => `$${fmtCompact(n)}`;

// Total system modules in the suite (active + inactive) — for "Modules Live".
const TOTAL_MODULES = 14;

const TABS = [
  { label: 'Dashboard', href: '/nexacore', active: true },
  { label: 'AI Team', href: '/nexacore/ai/team' },
  { label: 'Users', href: '/users' },
  { label: 'Custom Development', href: '/settings' },
];

export default function ControlRoomPage() {
  const { user } = useAuth();
  const [moduleStats, setModuleStats] = useState<Record<string, ModuleStat>>({});
  const [liveModules, setLiveModules] = useState<number>(TOTAL_MODULES);
  const [ai, setAi] = useState<{ team: number; spend: number }>({ team: 0, spend: 0 });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [ms, wk, us, mods] = await Promise.allSettled([
        api.get('/api/v1/development/module-stats'),
        api.get('/api/v1/ai/workers'),
        api.get('/api/v1/ai/usage'),
        api.get('/api/v1/development/modules'),
      ]);
      if (cancelled) return;
      if (ms.status === 'fulfilled') setModuleStats(ms.value.data?.data || {});
      if (wk.status === 'fulfilled' && us.status === 'fulfilled') {
        setAi({ team: (wk.value.data?.data || []).length, spend: us.value.data?.cost_usd || 0 });
      }
      if (mods.status === 'fulfilled') {
        const items: any[] = mods.value.data?.data || mods.value.data || [];
        const sys = items.filter((m) => m.is_system_module !== false);
        const active = sys.filter((m) => m.is_active !== false).length;
        if (active > 0) setLiveModules(active);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const totalRecords = Object.values(moduleStats).reduce((s, m) => s + (m.records || 0), 0);
  const totalValue = Object.values(moduleStats).reduce((s, m) => s + (m.amount || 0), 0);

  const now = new Date();
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = String((user as any)?.full_name || (user as any)?.first_name || user?.email || 'there')
    .split('@')[0].split(' ')[0];
  const longDate = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  const kpis = [
    { icon: FiBarChart2, label: 'Total Records', value: totalRecords.toLocaleString(), meta: 'across all modules' },
    { icon: FiFileText, label: 'Value Tracked', value: fmtMoney(totalValue), meta: 'invoices, orders & more' },
    { icon: FiGrid, label: 'Modules Live', value: `${liveModules}`, valueSub: `/${TOTAL_MODULES}`, meta: 'active in your workspace' },
    { icon: FiZap, label: 'AI Team', value: `${ai.team}`, meta: `staff · ${fmtMoney(ai.spend)} spent` },
  ];

  return (
    <ProtectedRoute>
      <div className="font-ui" style={{ maxWidth: 1440, margin: '0 auto', paddingBottom: 24 }}>
        {/* PAGE HEAD — title + segmented tabs */}
        <div className="flex items-end justify-between gap-4 mb-5 flex-wrap">
          <div className="font-display" style={{ fontSize: '1.7rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#000' }}>
            Home
          </div>
          <div className="flex gap-1 rounded-xl bg-white p-1.5" style={{ border: '1px solid #e9eaf2' }}>
            {TABS.map((t) => (
              <a key={t.label} href={t.href}
                 className="px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                 style={t.active
                   ? { background: '#5147e6', color: '#fff', boxShadow: '0 6px 14px -8px #5147e6' }
                   : { color: '#565a70' }}>
                {t.label}
                {!t.active && <FiChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </a>
            ))}
          </div>
        </div>

        {/* HERO */}
        <section className="relative overflow-hidden"
          style={{
            borderRadius: '16px',
            background:
              'radial-gradient(120% 150% at 88% -10%, rgba(138,123,245,0.55), transparent 55%),'
              + 'radial-gradient(90% 140% at 0% 120%, rgba(63,109,240,0.40), transparent 50%),'
              + 'linear-gradient(110deg, #221d54, #1a1648 55%, #15123c)',
            boxShadow: '0 20px 50px -30px rgba(34,29,84,0.9)',
          }}>
          <div className="absolute inset-0 pointer-events-none"
               style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '22px 22px', opacity: 0.5 }} />
          <div className="relative px-7 sm:px-8 py-7">
            <div className="flex items-start justify-between gap-5 flex-wrap">
              <div>
                <div className="font-display" style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.015em', color: '#fff', lineHeight: 1.1 }}>
                  {greeting}, {firstName}
                </div>
                <div className="mt-1.5" style={{ fontSize: '0.92rem', color: 'rgba(185,180,228,0.95)' }}>
                  {longDate} — your business at a glance
                </div>
              </div>
              <a href="/nexacore/ai/boardroom"
                 className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-transform hover:-translate-y-0.5"
                 style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', backdropFilter: 'blur(6px)' }}>
                🤝 Meet your AI team <FiArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-7">
              {kpis.map((k) => {
                const Icon = k.icon;
                return (
                  <div key={k.label} className="rounded-xl px-4.5 py-4"
                       style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.11)', backdropFilter: 'blur(4px)', padding: '16px 18px' }}>
                    <div className="flex items-center gap-2" style={{ fontSize: '0.69rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, color: '#a39ed4' }}>
                      <Icon className="w-3.5 h-3.5" style={{ color: '#8a7bf5' }} /> {k.label}
                    </div>
                    <div className="tabular-nums font-display" style={{ fontSize: '1.85rem', fontWeight: 700, letterSpacing: '-0.01em', color: '#fff', margin: '9px 0 3px', lineHeight: 1 }}>
                      {k.value}{k.valueSub && <span style={{ color: '#7c77ad' }}>{k.valueSub}</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#9d99c9' }}>{k.meta}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* BUSINESS OVERVIEW */}
        <div className="flex items-center gap-2.5 mt-8 mb-4">
          <span className="inline-flex items-center justify-center rounded-lg" style={{ width: 30, height: 30, background: '#eeedfd', color: '#5147e6' }}>
            <FiBarChart2 className="w-4 h-4" />
          </span>
          <div className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#000' }}>Business Overview</div>
        </div>
        <BusinessOverview />
      </div>
    </ProtectedRoute>
  );
}
