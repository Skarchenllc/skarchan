'use client';

import { useEffect, useState, useCallback } from 'react';

const SYS_USER = '00000000-0000-0000-0000-000000000001';
const money = (v: any) => (Number(v) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });

interface Line {
  product_id?: string; name?: string; sku?: string;
  quantity: number; unit_price: number; discount_pct: number; tax_rate: number;
}
interface Product { id: string; data: Record<string, any>; }

function totals(lines: Line[]) {
  let subtotal = 0, discount = 0, tax = 0;
  for (const l of lines) {
    const gross = (Number(l.quantity) || 0) * (Number(l.unit_price) || 0);
    const d = gross * (Number(l.discount_pct) || 0) / 100;
    const net = gross - d;
    const t = net * (Number(l.tax_rate) || 0) / 100;
    subtotal += gross; discount += d; tax += t;
  }
  return { subtotal, discount, tax, total: subtotal - discount + tax };
}

export default function DocumentBuilder({ recordId, entityType, backHref }: {
  recordId: string; entityType: 'quotes' | 'orders'; backHref: string;
}) {
  const [record, setRecord] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [picked, setPicked] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [r, p] = await Promise.all([
      fetch(`/api/v1/development/entity-records/${recordId}`).then(r => r.json()),
      fetch('/api/v1/development/entity-records?entity_type=sales_products&limit=500').then(r => r.json()),
    ]);
    setRecord(r);
    setLines((r?.data?.line_items || []).map((l: any) => ({
      product_id: l.product_id, name: l.name, sku: l.sku,
      quantity: Number(l.quantity) || 1, unit_price: Number(l.unit_price) || 0,
      discount_pct: Number(l.discount_pct) || 0, tax_rate: Number(l.tax_rate) || 0,
    })));
    setProducts((p.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
  }, [recordId]);

  useEffect(() => { load(); }, [load]);

  function addProduct() {
    const prod = products.find(p => p.id === picked);
    if (!prod) return;
    setLines(ls => [...ls, {
      product_id: prod.id, name: prod.data.name, sku: prod.data.sku,
      quantity: 1, unit_price: Number(prod.data.unit_price) || 0,
      discount_pct: 0, tax_rate: Number(prod.data.tax_rate) || 0,
    }]);
    setPicked(''); setSaved(null);
  }
  function update(i: number, k: keyof Line, v: any) {
    setLines(ls => ls.map((l, idx) => idx === i ? { ...l, [k]: v } : l)); setSaved(null);
  }
  function remove(i: number) { setLines(ls => ls.filter((_, idx) => idx !== i)); setSaved(null); }

  async function save() {
    setSaving(true); setSaved(null);
    try {
      const r = await fetch(`/api/v1/sales-ops/document/${recordId}/recalc`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items: lines, last_modified_by: SYS_USER }),
      });
      const j = await r.json();
      setRecord(j);
      setSaved(`Saved · total ${money(j?.data?.total_amount)}`);
    } catch (e: any) { setSaved(`Failed: ${e?.message || e}`); } finally { setSaving(false); }
  }

  async function convert(kind: 'convert' | 'invoice') {
    const path = kind === 'convert' ? `quotes/${recordId}/convert` : `orders/${recordId}/invoice`;
    try {
      const r = await fetch(`/api/v1/sales-ops/${path}`, { method: 'POST' });
      const j = await r.json();
      setSaved(j.ok ? (j.order_number ? `Converted to order ${j.order_number}` : `Invoiced as ${j.invoice_number}`) : `Failed: ${j.detail}`);
    } catch (e: any) { setSaved(`Failed: ${e?.message || e}`); }
  }

  const t = totals(lines);
  const d = record?.data || {};
  const num = d.quote_number || d.order_number || recordId.slice(0, 8);

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <a href={backHref} className="text-xs text-gray-500 hover:underline">← back</a>
          <h2 className="text-lg font-semibold text-gray-900">{entityType === 'quotes' ? 'Quote' : 'Order'} {num}</h2>
          <p className="text-xs text-gray-500">{d.customer_name || 'No customer'} · {d.status || '—'}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/api/v1/sales-ops/document/${recordId}/print`} target="_blank" rel="noreferrer"
            className="px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid #64748b', color: '#475569' }}>Print</a>
          {entityType === 'quotes'
            ? <button onClick={() => convert('convert')} className="px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid #01411C', color: '#01411C' }}>Convert to Order</button>
            : <button onClick={() => convert('invoice')} className="px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid #01411C', color: '#01411C' }}>Create Invoice</button>}
          <button onClick={save} disabled={saving}
            className="px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#5147e6' }}>
            {saving ? 'Saving…' : 'Save & recalculate'}
          </button>
        </div>
      </div>
      {saved && <div className="mb-3 p-2 text-xs rounded" style={{ background: saved.startsWith('Failed') ? '#fef2f2' : '#f0fdf4', color: saved.startsWith('Failed') ? '#b91c1c' : '#012E14' }}>{saved}</div>}

      <div className="flex gap-2 mb-3">
        <select value={picked} onChange={e => setPicked(e.target.value)} className="text-sm border rounded px-2 py-1.5 flex-1">
          <option value="">Add a product from the price book…</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.data.name} {p.data.sku ? `(${p.data.sku})` : ''} — {money(p.data.unit_price)}</option>
          ))}
        </select>
        <button onClick={addProduct} disabled={!picked} className="px-3 py-1.5 text-sm font-semibold disabled:opacity-40" style={{ border: '1px solid #5147e6', color: '#5147e6' }}>+ Add line</button>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto" style={{ border: '1px solid #e5e7eb' }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-500 border-b" style={{ borderColor: '#e5e7eb' }}>
            <th className="p-2">Product</th><th className="p-2 w-20">Qty</th><th className="p-2 w-28">Unit Price</th>
            <th className="p-2 w-20">Disc %</th><th className="p-2 w-20">Tax %</th><th className="p-2 w-28 text-right">Line Total</th><th className="p-2 w-8"></th>
          </tr></thead>
          <tbody>
            {lines.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-gray-400 text-xs">No line items yet — add products above.</td></tr>}
            {lines.map((l, i) => {
              const gross = (l.quantity || 0) * (l.unit_price || 0);
              const net = gross - gross * (l.discount_pct || 0) / 100;
              const lineTotal = net + net * (l.tax_rate || 0) / 100;
              return (
                <tr key={i} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                  <td className="p-2"><div className="font-medium text-gray-800">{l.name}</div>{l.sku && <div className="text-[11px] text-gray-400">{l.sku}</div>}</td>
                  <td className="p-2"><input type="number" value={l.quantity} min={0} onChange={e => update(i, 'quantity', Number(e.target.value))} className="w-16 border rounded px-1 py-0.5" /></td>
                  <td className="p-2"><input type="number" value={l.unit_price} min={0} step="0.01" onChange={e => update(i, 'unit_price', Number(e.target.value))} className="w-24 border rounded px-1 py-0.5" /></td>
                  <td className="p-2"><input type="number" value={l.discount_pct} min={0} max={100} onChange={e => update(i, 'discount_pct', Number(e.target.value))} className="w-16 border rounded px-1 py-0.5" /></td>
                  <td className="p-2"><input type="number" value={l.tax_rate} min={0} onChange={e => update(i, 'tax_rate', Number(e.target.value))} className="w-16 border rounded px-1 py-0.5" /></td>
                  <td className="p-2 text-right font-semibold text-gray-900">{money(lineTotal)}</td>
                  <td className="p-2"><button onClick={() => remove(i)} className="text-red-500 hover:text-red-700">✕</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-3">
        <div className="w-64 text-sm space-y-1">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{money(t.subtotal)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Discount</span><span>−{money(t.discount)}</span></div>
          <div className="flex justify-between text-gray-600"><span>Tax</span><span>{money(t.tax)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 border-t pt-1" style={{ borderColor: '#e5e7eb' }}><span>Total</span><span>{money(t.total)}</span></div>
        </div>
      </div>
    </div>
  );
}
