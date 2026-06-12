'use client';

import { useEffect, useState, useCallback } from 'react';

const money = (v: any) => (Number(v) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
interface Doc { id: string; data: Record<string, any>; }

export default function BuilderIndexPage() {
  const [quotes, setQuotes] = useState<Doc[]>([]);
  const [orders, setOrders] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [q, o] = await Promise.all([
        fetch('/api/v1/development/entity-records?entity_type=quotes&limit=200').then(r => r.json()),
        fetch('/api/v1/development/entity-records?entity_type=orders&limit=200').then(r => r.json()),
      ]);
      setQuotes((q.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
      setOrders((o.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const Section = ({ title, docs, base, numKey }: { title: string; docs: Doc[]; base: string; numKey: string }) => (
    <div className="bg-white rounded-lg shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
      <div className="px-3 py-2 border-b text-sm font-semibold text-gray-800" style={{ borderColor: '#e5e7eb' }}>{title}</div>
      <ul>
        {docs.length === 0 && <li className="px-3 py-4 text-xs text-gray-400">None yet.</li>}
        {docs.map(d => (
          <li key={d.id} className="px-3 py-2 flex items-center justify-between border-b last:border-0" style={{ borderColor: '#f1f5f9' }}>
            <div>
              <a href={`${base}/${d.id}`} className="text-sm font-medium hover:underline" style={{ color: '#5147e6' }}>
                {d.data[numKey] || d.id.slice(0, 8)}
              </a>
              <span className="text-xs text-gray-500 ml-2">{d.data.customer_name || '—'} · {d.data.item_count || 0} items</span>
            </div>
            <span className="text-sm font-semibold text-gray-900">{money(d.data.total_amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="px-1">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Document Builder</h2>
      <p className="text-xs text-gray-500 mb-4">Open a quote or order to add products and calculate totals from the price book.</p>
      {loading ? <div className="text-sm text-gray-500 py-10 text-center">Loading…</div> : (
        <div className="grid gap-4 md:grid-cols-2">
          <Section title="Quotes" docs={quotes} base="/sales/quotes" numKey="quote_number" />
          <Section title="Orders" docs={orders} base="/sales/orders" numKey="order_number" />
        </div>
      )}
    </div>
  );
}
