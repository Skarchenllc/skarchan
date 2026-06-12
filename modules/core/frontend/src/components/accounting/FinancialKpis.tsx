'use client';

/**
 * Accounting financial KPIs — Total Revenue / Expenses / Net Income / Cash Flow.
 *
 * Computed LIVE from the actual transaction records the user has entered, not
 * from pre-set GL account balances:
 *   - Revenue   = sum of customer invoices
 *   - Expenses  = sum of bill payments
 *   - Net income= revenue − expenses
 *   - Cash flow = cash received − cash paid (net operating cash)
 * So the dashboard always reflects the real data project-wide.
 */
import { useEffect, useState } from 'react';

type Rec = { id: string; data: any };

const fmtUSD = (n: number) => `$${(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const num = (v: any) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const sumField = (rows: Rec[], ...fields: string[]) =>
  rows.reduce((s, r) => {
    for (const f of fields) { const v = num(r.data?.[f]); if (v) return s + v; }
    return s;
  }, 0);

export default function FinancialKpis() {
  const [invoices, setInvoices] = useState<Rec[]>([]);
  const [billPayments, setBillPayments] = useState<Rec[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<Rec[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async (et: string, set: (r: Rec[]) => void) => {
      try {
        const r = await fetch(`/api/v1/development/entity-records?entity_type=${et}&limit=2000`);
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) set(Array.isArray(j) ? j : (j.data || []));
      } catch { /* ignore */ }
    };
    load('invoices', setInvoices);
    load('bill_payments', setBillPayments);
    load('invoice_payments', setInvoicePayments);
    return () => { cancelled = true; };
  }, []);

  const totalRevenue = sumField(invoices, 'total', 'total_amount', 'amount');
  const totalExpenses = sumField(billPayments, 'amount');
  const netIncome = totalRevenue - totalExpenses;
  const cashFlow = sumField(invoicePayments, 'amount') - totalExpenses;

  const items = [
    { label: 'Total Revenue',  value: fmtUSD(totalRevenue),  sub: `${invoices.length} invoices` },
    { label: 'Total Expenses', value: fmtUSD(totalExpenses),  sub: `${billPayments.length} bill payments` },
    { label: 'Net Income',     value: fmtUSD(netIncome),      sub: 'revenue − expenses' },
    { label: 'Cash Flow',      value: fmtUSD(cashFlow),       sub: 'net operating cash' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: '1rem' }}>
      {items.map((it) => (
        <div key={it.label} className="bg-white px-5 py-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div className="text-xs uppercase tracking-wide mb-2" style={{ color: '#6b7280', fontWeight: 600, letterSpacing: '0.06em' }}>{it.label}</div>
          <div className="text-lg" style={{ fontWeight: 700, color: '#0f172a' }}>{it.value}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{it.sub}</div>
        </div>
      ))}
    </div>
  );
}
