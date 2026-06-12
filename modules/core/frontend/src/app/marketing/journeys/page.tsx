'use client';

import { useEffect, useState, useCallback } from 'react';

interface Journey { id: string; data: Record<string, any>; }

function stepCount(j: Journey): number {
  const s = j.data.steps;
  if (Array.isArray(s)) return s.length;
  if (typeof s === 'string') { try { return JSON.parse(s).length; } catch { return 0; } }
  return 0;
}

export default function JourneysPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/development/entity-records?entity_type=journeys&limit=200');
      const j = await r.json();
      setJourneys((j.data || []).map((rec: any) => ({ id: rec.id, data: rec.data || {} })));
    } catch { setJourneys([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function post(url: string, label: string, key: string) {
    setBusy(key); setMsg(null);
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const j = await r.json();
      setMsg(`${label}: ${JSON.stringify(j)}`);
    } catch (e: any) {
      setMsg(`${label} failed: ${e?.message || e}`);
    } finally { setBusy(null); }
  }

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Journeys</h2>
          <p className="text-xs text-gray-500">Drip sequences. Enroll an audience, then run the drip to advance them.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => post('/api/v1/marketing-ops/journeys/run', 'Run drip', 'run')}
            disabled={busy !== null}
            className="px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#7c3aed' }}>
            {busy === 'run' ? 'Running…' : '▶ Run drip now'}
          </button>
          <button onClick={() => post('/api/v1/marketing-ops/email/process-queue', 'Process email queue', 'queue')}
            disabled={busy !== null}
            className="px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: '#ec4899' }}>
            {busy === 'queue' ? 'Processing…' : '✉ Process email queue'}
          </button>
          <a href="/marketing/journeys/new" className="px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: '#5147e6' }}>
            + New Journey
          </a>
        </div>
      </div>

      {msg && <div className="mb-3 p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono break-all">{msg}</div>}

      {loading ? (
        <div className="text-sm text-gray-500 py-10 text-center">Loading journeys…</div>
      ) : journeys.length === 0 ? (
        <div className="text-sm text-gray-500 py-10 text-center">No journeys yet. Create one to start a drip sequence.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {journeys.map(j => (
            <div key={j.id} className="bg-white rounded-lg p-4 shadow-sm" style={{ border: '1px solid #e5e7eb' }}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{j.data.name || 'Untitled'}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded" style={{ background: '#f3e8ff', color: '#7c3aed' }}>
                  {j.data.status || 'Draft'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{j.data.description || '—'}</p>
              <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                <span>{stepCount(j)} steps · audience: {j.data.audience_entity || 'leads'}</span>
                <a href={`/marketing/journeys/${j.id}`} className="font-semibold hover:underline" style={{ color: '#7c3aed' }}>Edit steps →</a>
              </div>
              <button
                onClick={() => post(`/api/v1/marketing-ops/journeys/${j.id}/enroll`, `Enrolled into ${j.data.name}`, `enroll-${j.id}`)}
                disabled={busy !== null}
                className="mt-3 w-full px-2 py-1.5 text-xs font-semibold disabled:opacity-50"
                style={{ border: '1px solid #7c3aed', color: '#7c3aed' }}>
                {busy === `enroll-${j.id}` ? 'Enrolling…' : 'Enroll audience'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
