'use client';

import { useEffect, useState, useCallback } from 'react';

interface Seg { id: string; data: Record<string, any>; }

export default function SegmentsPage() {
  const [segs, setSegs] = useState<Seg[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/development/entity-records?entity_type=segments&limit=200');
      const j = await r.json();
      setSegs((j.data || []).map((x: any) => ({ id: x.id, data: x.data || {} })));
    } catch { setSegs([]); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  async function materialize(id: string) {
    setBusy(id);
    try {
      const r = await fetch(`/api/v1/marketing-ops/segments/${id}/materialize`, { method: 'POST' });
      const j = await r.json();
      setMsg(m => ({ ...m, [id]: `${j.member_count} members${j.enrolled ? ` · enrolled ${j.enrolled} in ${j.journey}` : ''}` }));
      await load();
    } catch (e: any) { setMsg(m => ({ ...m, [id]: `Failed: ${e?.message || e}` })); } finally { setBusy(null); }
  }

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Segments</h2>
          <p className="text-xs text-gray-500">Dynamic audiences. Criteria is one rule per line (e.g. <code>grade = Hot</code>, <code>score &gt; 50</code>).</p>
        </div>
        <a href="/marketing/segments/new" className="px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: '#5147e6' }}>+ New Segment</a>
      </div>

      {loading ? <div className="text-sm text-gray-500 py-10 text-center">Loading…</div> : segs.length === 0 ? (
        <div className="text-sm text-gray-500 py-10 text-center">No segments yet.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segs.map(s => (
            <div key={s.id} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{s.data.name || 'Untitled'}</span>
                <span className="text-xs font-bold" style={{ color: '#7c3aed' }}>{s.data.member_count ?? '—'} members</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{s.data.description || '—'}</p>
              {s.data.criteria && <pre className="text-[11px] text-gray-500 bg-gray-50 rounded p-1.5 mt-2 whitespace-pre-wrap">{s.data.criteria}</pre>}
              {s.data.journey_name && <div className="text-xs text-gray-400 mt-1">↳ auto-enrolls: {s.data.journey_name}</div>}
              <button onClick={() => materialize(s.id)} disabled={busy !== null}
                className="mt-2 w-full px-2 py-1.5 text-xs font-semibold disabled:opacity-50" style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}>
                {busy === s.id ? 'Materializing…' : '↻ Materialize'}
              </button>
              {msg[s.id] && <div className="text-[11px] text-green-700 mt-1">{msg[s.id]}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
