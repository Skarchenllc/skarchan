'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

const SYS_USER = '00000000-0000-0000-0000-000000000001';
const ACTIONS = ['send_email', 'send_sms', 'create_activity', 'update_field', 'branch', 'wait'];
const OPS = ['=', '!=', '>', '<', '>=', '<=', '~'];

interface Step { action: string; delay_days: number; value?: string; field?: string; cond_field?: string; cond_op?: string; cond_value?: string; }

export default function JourneyBuilderPage() {
  const id = String(useParams()?.id || '');
  const [rec, setRec] = useState<any>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [saved, setSaved] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch(`/api/v1/development/entity-records/${id}`).then(r => r.json());
    setRec(r);
    let s = r?.data?.steps;
    if (typeof s === 'string') { try { s = JSON.parse(s); } catch { s = []; } }
    setSteps(Array.isArray(s) ? s : []);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const up = (i: number, k: keyof Step, v: any) => { setSteps(s => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x)); setSaved(null); };
  const add = () => { setSteps(s => [...s, { action: 'send_email', delay_days: 0, value: '' }]); setSaved(null); };
  const del = (i: number) => { setSteps(s => s.filter((_, idx) => idx !== i)); setSaved(null); };
  const move = (i: number, dir: number) => setSteps(s => {
    const j = i + dir; if (j < 0 || j >= s.length) return s;
    const c = [...s]; [c[i], c[j]] = [c[j], c[i]]; return c;
  });

  async function save() {
    setSaving(true); setSaved(null);
    try {
      await fetch(`/api/v1/development/entity-records/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...rec.data, steps }, last_modified_by: SYS_USER }),
      });
      setSaved(`Saved ${steps.length} steps`);
    } catch (e: any) { setSaved(`Failed: ${e?.message || e}`); } finally { setSaving(false); }
  }

  if (!rec) return <div className="text-sm text-gray-500 py-10 text-center">Loading…</div>;

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <a href="/marketing/journeys" className="text-xs text-gray-500 hover:underline">← journeys</a>
          <h2 className="text-lg font-semibold text-gray-900">{rec.data?.name || 'Journey'} — Steps</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={add} className="px-3 py-1.5 text-sm font-semibold" style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}>+ Step</button>
          <button onClick={save} disabled={saving} className="px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#5147e6' }}>{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
      {saved && <div className="mb-3 p-2 text-xs rounded" style={{ background: saved.startsWith('Failed') ? '#fef2f2' : '#f0fdf4', color: saved.startsWith('Failed') ? '#b91c1c' : '#012E14' }}>{saved}</div>}

      <div className="space-y-2">
        {steps.length === 0 && <div className="text-sm text-gray-400 text-center py-6">No steps. Add one to start the sequence.</div>}
        {steps.map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-3 shadow-sm flex items-start gap-2 flex-wrap" style={{ border: '1px solid #e5e7eb' }}>
            <div className="flex flex-col gap-0.5 text-gray-400">
              <button onClick={() => move(i, -1)} className="hover:text-gray-700 text-xs">▲</button>
              <button onClick={() => move(i, 1)} className="hover:text-gray-700 text-xs">▼</button>
            </div>
            <div className="text-xs text-gray-400 w-5 pt-1.5">{i + 1}</div>
            <select value={s.action} onChange={e => up(i, 'action', e.target.value)} className="text-sm border rounded px-2 py-1">
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <label className="text-xs text-gray-500 flex items-center gap-1">wait
              <input type="number" min={0} value={s.delay_days} onChange={e => up(i, 'delay_days', Number(e.target.value))} className="w-14 border rounded px-1 py-1" />d
            </label>
            {(s.action === 'send_email' || s.action === 'send_sms' || s.action === 'create_activity') && (
              <input placeholder={s.action === 'send_email' ? 'template' : s.action === 'send_sms' ? 'message' : 'task subject'}
                value={s.value || ''} onChange={e => up(i, 'value', e.target.value)} className="text-sm border rounded px-2 py-1 flex-1 min-w-[140px]" />
            )}
            {s.action === 'update_field' && (<>
              <input placeholder="field" value={s.field || ''} onChange={e => up(i, 'field', e.target.value)} className="text-sm border rounded px-2 py-1 w-28" />
              <input placeholder="value" value={s.value || ''} onChange={e => up(i, 'value', e.target.value)} className="text-sm border rounded px-2 py-1 w-28" />
            </>)}
            {s.action === 'branch' && (<>
              <input placeholder="field" value={s.cond_field || ''} onChange={e => up(i, 'cond_field', e.target.value)} className="text-sm border rounded px-2 py-1 w-24" />
              <select value={s.cond_op || '='} onChange={e => up(i, 'cond_op', e.target.value)} className="text-sm border rounded px-1 py-1">{OPS.map(o => <option key={o}>{o}</option>)}</select>
              <input placeholder="value" value={s.cond_value || ''} onChange={e => up(i, 'cond_value', e.target.value)} className="text-sm border rounded px-2 py-1 w-24" />
              <span className="text-[11px] text-gray-400 pt-1.5">else exit</span>
            </>)}
            <button onClick={() => del(i)} className="text-red-500 hover:text-red-700 ml-auto pt-1">✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
