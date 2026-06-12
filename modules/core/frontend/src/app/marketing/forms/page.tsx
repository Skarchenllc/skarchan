'use client';

import { useEffect, useState, useCallback } from 'react';

interface Form { id: string; data: Record<string, any>; }

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Record<string, { name: string; email: string; company: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, any>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/development/entity-records?entity_type=forms&limit=100');
      const j = await r.json();
      setForms((j.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
    } catch { setForms([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  function field(id: string, k: 'name' | 'email' | 'company', v: string) {
    setTest(t => ({ ...t, [id]: { name: '', email: '', company: '', ...t[id], [k]: v } }));
  }

  async function submit(id: string) {
    const body = test[id] || { name: '', email: '', company: '' };
    setBusy(id);
    try {
      const r = await fetch(`/api/v1/public/forms/${id}/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await r.json();
      setResult(rs => ({ ...rs, [id]: data }));
    } catch (e: any) {
      setResult(rs => ({ ...rs, [id]: { error: e?.message || String(e) } }));
    } finally { setBusy(null); }
  }

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Capture Forms</h2>
          <p className="text-xs text-gray-500">Public forms create &amp; dedupe leads, score them, and (optionally) enroll a journey.</p>
        </div>
        <a href="/marketing/forms/new" className="px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: '#5147e6' }}>+ New Form</a>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-10 text-center">Loading forms…</div>
      ) : forms.length === 0 ? (
        <div className="text-sm text-gray-500 py-10 text-center">No forms yet. Create one to start capturing leads.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map(f => {
            const res = result[f.id];
            return (
              <div key={f.id} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{f.data.name || 'Untitled form'}</span>
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: '#f3e8ff', color: '#7c3aed' }}>{f.data.status || 'Draft'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">{f.data.description || '—'}</p>
                <div className="text-[11px] text-gray-400 mt-2 font-mono break-all">
                  POST /api/v1/public/forms/{f.id}/submit
                </div>
                {f.data.journey_name && <div className="text-xs text-gray-500 mt-1">Enrolls journey: <strong>{f.data.journey_name}</strong></div>}

                <div className="mt-3 border-t pt-3" style={{ borderColor: '#f1f5f9' }}>
                  <div className="text-xs font-semibold text-gray-600 mb-1.5">Test submit</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input placeholder="Name" value={test[f.id]?.name || ''} onChange={e => field(f.id, 'name', e.target.value)} className="text-xs border px-2 py-1 rounded" />
                    <input placeholder="Email" value={test[f.id]?.email || ''} onChange={e => field(f.id, 'email', e.target.value)} className="text-xs border px-2 py-1 rounded" />
                    <input placeholder="Company" value={test[f.id]?.company || ''} onChange={e => field(f.id, 'company', e.target.value)} className="text-xs border px-2 py-1 rounded" />
                  </div>
                  <button onClick={() => submit(f.id)} disabled={busy === f.id}
                    className="mt-2 w-full px-2 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}>
                    {busy === f.id ? 'Submitting…' : 'Submit as new lead'}
                  </button>
                  {res && (
                    <div className="mt-2 text-[11px] p-2 rounded font-mono break-all" style={{ background: res.error ? '#fef2f2' : '#f0fdf4', color: res.error ? '#b91c1c' : '#012E14' }}>
                      {res.error ? res.error
                        : `${res.new_lead ? 'New' : 'Existing'} lead "${res.lead_name}" · score ${res.score} (${res.grade})${res.qualified ? ' · QUALIFIED' : ''}${res.enrolled_journey ? ` · enrolled ${res.enrolled_journey}` : ''}`}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
