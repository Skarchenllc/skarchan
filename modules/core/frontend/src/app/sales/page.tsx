'use client';

import { useEffect, useState } from 'react';
import ModuleKpis, { KpiItem } from '@shared/components/ModuleKpis';
import InsightsDashboard from '@/components/InsightsDashboard';
import ModuleStatusCharts from '@/components/ModuleStatusCharts';

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

const sum = (rows: Rec[], key: string) =>
  rows.reduce((s, r) => s + (Number(r.data?.[key]) || 0), 0);

export default function SalesDashboardPage() {
  const [customers,     setCustomers]     = useState<Rec[]>([]);
  const [opportunities, setOpportunities] = useState<Rec[]>([]);
  const [quotes,        setQuotes]        = useState<Rec[]>([]);
  const [orders,        setOrders]        = useState<Rec[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    (async () => {
      const [c, o, q, od] = await Promise.all([
        fetchEntity('customers'),
        fetchEntity('opportunities'),
        fetchEntity('quotes'),
        fetchEntity('orders'),
      ]);
      setCustomers(c);
      setOpportunities(o);
      setQuotes(q);
      setOrders(od);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: '#6b7280' }}>Loading dashboard…</div>;
  }

  const countKpis: KpiItem[] = [
    { label: 'Customers',     value: customers.length,     href: '/sales/customers' },
    { label: 'Opportunities', value: opportunities.length, href: '/sales/opportunities' },
    { label: 'Quotes',        value: quotes.length,        href: '/sales/quotes' },
    { label: 'Orders',        value: orders.length,        href: '/sales/orders' },
  ];

  const valueKpis: KpiItem[] = [
    { label: 'Customer Revenue',    value: fmtUSD(sum(customers, 'annual_revenue')) },
    { label: 'Opportunities Value', value: fmtUSD(sum(opportunities, 'amount')) },
    { label: 'Quotes Value',        value: fmtUSD(sum(quotes, 'total_amount')) },
    { label: 'Orders Revenue',      value: fmtUSD(sum(orders, 'total_amount')) },
  ];

  return (
    <div className="px-4 pb-6">
      <ModuleKpis items={countKpis} />
      <ModuleKpis items={valueKpis} />
      <ModuleStatusCharts
        funnel={[
          { label: 'Leads', t: 'leads' },
          { label: 'Opportunities', t: 'opportunities' },
          { label: 'Quotes', t: 'quotes' },
          { label: 'Orders', t: 'orders' },
          { label: 'Invoices', t: 'invoices' },
        ]}
        status={[
          { title: 'Pipeline by stage', t: 'opportunities' },
          { title: 'Revenue by status', t: 'invoices' },
          { title: 'Orders by status', t: 'orders' },
        ]}
      />
      <InsightsDashboard scope="sales" />
    </div>
  );
}
