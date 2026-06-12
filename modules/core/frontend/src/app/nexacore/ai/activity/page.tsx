'use client';

import { useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { Tabs } from '@/components/ai/kit';
import ReportsPanel from '../reports/page';
import UsagePanel from '../usage/page';
import RunHistoryPanel from '../../automation/runs/page';
import LedgerPanel from '../../automation/ledger/page';

// Activity — the read-and-audit surface: saved decision notes (Reports), what the
// AI spent (Usage), which automation rules fired (Run History), and which writes
// actually landed and can be undone (Action Ledger).
const VALID = ['reports', 'usage', 'runs', 'ledger'];

export default function ActivityPage() {
  const [tab, setTab] = useState('reports');

  // Deep-link the active tab via ?tab=… (read on mount, reflected on change).
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t && VALID.includes(t)) setTab(t);
  }, []);
  const changeTab = (k: string) => {
    setTab(k);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', k);
    window.history.replaceState(null, '', url.toString());
  };

  const tabs = [
    { key: 'reports', label: 'Reports' },
    { key: 'usage', label: 'Usage & Spend', hint: 'AI metering — budget, spend trend, and per-run cost.' },
    { key: 'runs', label: 'Run History', hint: 'Audit log of every automation rule that fired.' },
    { key: 'ledger', label: 'Action Ledger', hint: 'Every write the system made, with before/after state — undo any entry.' },
  ];

  return (
    <div className="space-y-5">
      <h1 className="text-hero" style={{ color: '#000000' }}>
        Activity
      </h1>

      {/* Summary — the AI activity hub in one box above the tabs. */}
      <div
        className="flex items-start gap-3.5 rounded-xl p-5"
        style={{ border: '1px solid #DCDCEA', backgroundColor: '#F2F2F8' }}
      >
        <span
          className="shrink-0 inline-flex items-center justify-center rounded-lg"
          style={{ width: 40, height: 40, backgroundColor: '#5147e6', color: '#fff' }}
        >
          <ClipboardList className="w-5 h-5" />
        </span>
        <p className="leading-relaxed" style={{ color: '#000000', fontSize: '15px' }}>
          Your AI activity hub — saved <span className="font-semibold">decision notes</span> from
          the Meeting Room (the team’s synthesised answers, each with key findings and prioritised recommendations), plus a
          full <span className="font-semibold">audit trail</span> of what the AI and automation
          engine did: what it cost, which rules fired, and exactly which changes landed — each one reversible.
        </p>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={changeTab} />
      <div>{tab === 'reports' ? <ReportsPanel /> : tab === 'usage' ? <UsagePanel /> : tab === 'runs' ? <RunHistoryPanel /> : <LedgerPanel />}</div>
    </div>
  );
}
