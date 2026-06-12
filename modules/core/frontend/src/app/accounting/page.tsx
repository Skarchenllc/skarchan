'use client';

import { useEffect, useState } from 'react';
import DashboardCard from '@shared/components/DashboardCard';

type Rec = { id: string; data: any };

const fetchEntity = async (entityType: string): Promise<Rec[]> => {
  try {
    const r = await fetch(`/api/v1/development/entity-records?entity_type=${entityType}&limit=1000`);
    if (!r.ok) return [];
    const j = await r.json();
    return Array.isArray(j) ? j : (j.data || []);
  } catch { return []; }
};

const fmtUSD = (n: number) =>
  `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const monthLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', year: '2-digit' });
};

export default function AccountingDashboardPage() {
  const [accounts,     setAccounts]     = useState<Rec[]>([]);
  const [transactions, setTransactions] = useState<Rec[]>([]);
  const [invoices,     setInvoices]     = useState<Rec[]>([]);
  const [bills,        setBills]        = useState<Rec[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    (async () => {
      const [a, t, i, b] = await Promise.all([
        fetchEntity('accounts'),
        fetchEntity('transactions'),
        fetchEntity('invoices'),
        fetchEntity('bills'),
      ]);
      setAccounts(a);
      setTransactions(t);
      setInvoices(i);
      setBills(b);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  // ── Account balances by type ──
  const byType: Record<string, number> = {};
  for (const a of accounts) {
    const t = String(a.data?.account_type || 'Unknown');
    byType[t] = (byType[t] || 0) + (Number(a.data?.balance) || 0);
  }
  const TYPE_ORDER = ['Assets','Liabilities','Equity','Revenue','Expenses'];
  const balanceRows = Object.entries(byType)
    .sort(([a],[b]) => {
      const ai = TYPE_ORDER.indexOf(a), bi = TYPE_ORDER.indexOf(b);
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
    .map(([type, total]) => ({ type, total }));
  const maxBalance = Math.max(...balanceRows.map(r => Math.abs(r.total)), 1);

  // ── Monthly revenue vs expenses, from transactions ──
  // Bucket by yyyy-mm using the transaction's account_type to classify it.
  const monthly: Record<string, { revenue: number; expenses: number }> = {};
  for (const t of transactions) {
    const dStr = t.data?.transaction_date || t.data?.date;
    if (!dStr) continue;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const at = (t.data?.account_type || '').toLowerCase();
    const amt = Number(t.data?.amount) || 0;
    monthly[key] = monthly[key] || { revenue: 0, expenses: 0 };
    if (at === 'revenue') monthly[key].revenue += amt;
    else if (at === 'expenses') monthly[key].expenses += amt;
  }
  const months = Object.keys(monthly).sort().slice(-6);
  const monthlyRows = months.map(m => ({
    month: monthLabel(`${m}-01`),
    revenue: monthly[m].revenue,
    expenses: monthly[m].expenses,
  }));
  const maxMonthly = Math.max(...monthlyRows.flatMap(r => [r.revenue, r.expenses]), 1);

  // ── Receivable / Payable summary ──
  const receivablesOpen = invoices
    .filter(i => !['Paid','Cancelled'].includes(String(i.data?.status || '')))
    .reduce((s, i) => s + (Number(i.data?.total) || Number(i.data?.amount) || 0), 0);
  const payablesOpen = bills
    .filter(b => !['Paid','Cancelled'].includes(String(b.data?.status || '')))
    .reduce((s, b) => s + (Number(b.data?.amount) || 0), 0);
  const overdueInvoices = invoices.filter(i => String(i.data?.status) === 'Overdue').length;
  const overdueBills    = bills.filter(b => String(b.data?.status) === 'Overdue').length;

  return (
    <div className="px-4 pb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <DashboardCard
          title="Account Balances by Type"
          viewAllHref="/accounting/chart-of-accounts"
          empty={balanceRows.length === 0}
          emptyMessage="Set up your Chart of Accounts to see balances here."
        >
          <div className="space-y-2">
            {balanceRows.map(r => {
              const pct = (Math.abs(r.total) / maxBalance) * 100;
              return (
                <div key={r.type}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-semibold">{r.type}</span>
                    <span>{fmtUSD(r.total)}</span>
                  </div>
                  <div className="w-full" style={{ height: '8px', backgroundColor: '#f1f5f9' }}>
                    <div style={{ width: `${pct}%`, height: '100%', backgroundColor: '#5147e6' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard
          title="AR / AP Summary"
          empty={invoices.length === 0 && bills.length === 0}
          emptyMessage="No invoices or bills recorded yet."
        >
          <table className="w-full text-sm">
            <tbody>
              <tr>
                <td className="py-1.5" style={{ color: '#6b7280' }}>Open Receivables</td>
                <td className="py-1.5 text-right font-semibold">{fmtUSD(receivablesOpen)}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td className="py-1.5" style={{ color: '#6b7280' }}>Open Payables</td>
                <td className="py-1.5 text-right font-semibold">{fmtUSD(payablesOpen)}</td>
              </tr>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td className="py-1.5" style={{ color: '#6b7280' }}>Overdue Invoices</td>
                <td
                  className="py-1.5 text-right font-semibold"
                  style={{ color: overdueInvoices > 0 ? '#b91c1c' : '#0f172a' }}
                >
                  {overdueInvoices}
                </td>
              </tr>
              <tr style={{ borderTop: '1px solid #f1f5f9' }}>
                <td className="py-1.5" style={{ color: '#6b7280' }}>Overdue Bills</td>
                <td
                  className="py-1.5 text-right font-semibold"
                  style={{ color: overdueBills > 0 ? '#b91c1c' : '#0f172a' }}
                >
                  {overdueBills}
                </td>
              </tr>
            </tbody>
          </table>
        </DashboardCard>
      </div>

      <DashboardCard
        title="Monthly Revenue vs Expenses"
        empty={monthlyRows.length === 0}
        emptyMessage="No posted transactions yet."
      >
        <table className="w-full text-sm">
          <thead>
            <tr style={{ color: '#6b7280' }}>
              <th className="text-left py-1.5">Month</th>
              <th className="text-left py-1.5" style={{ width: '40%' }}>Revenue</th>
              <th className="text-left py-1.5" style={{ width: '40%' }}>Expenses</th>
            </tr>
          </thead>
          <tbody>
            {monthlyRows.map(r => (
              <tr key={r.month} style={{ borderTop: '1px solid #f1f5f9' }}>
                <td className="py-1.5 font-semibold">{r.month}</td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1" style={{ height: '6px', backgroundColor: '#f1f5f9' }}>
                      <div style={{ width: `${(r.revenue / maxMonthly) * 100}%`, height: '100%', backgroundColor: '#012E14' }} />
                    </div>
                    <span className="text-xs">{fmtUSD(r.revenue)}</span>
                  </div>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1" style={{ height: '6px', backgroundColor: '#f1f5f9' }}>
                      <div style={{ width: `${(r.expenses / maxMonthly) * 100}%`, height: '100%', backgroundColor: '#b91c1c' }} />
                    </div>
                    <span className="text-xs">{fmtUSD(r.expenses)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>
    </div>
  );
}
