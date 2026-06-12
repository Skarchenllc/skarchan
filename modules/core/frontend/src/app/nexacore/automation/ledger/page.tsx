'use client';

import { useEffect, useState, useCallback } from 'react';

interface Entry { id: string; created_at?: string; [k: string]: any; }

export default function ActionLedgerPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/v1/automation/ledger?limit=100').then(r => r.json());
      setEntries(Array.isArray(r) ? r : []);
    } catch { /* noop */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function undo(id: string) {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/v1/automation/ledger/${id}/undo`, { method: 'POST' });
      const body = await r.json();
      setMsg(body.error ? `Undo failed: ${body.error}` : `Undone: ${body.detail}`);
      await load();
    } catch (e: any) { setMsg(`Failed: ${e?.message || e}`); } finally { setBusy(false); }
  }

  const fmt = (v: any) => v == null ? '—' : (typeof v === 'object' ? JSON.stringify(v) : String(v));

  return (
    <div className="px-1">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Action Ledger</h2>
        <p className="text-xs text-gray-500">
          Every side-effect the automation/AI layer applied, with before/after state. Each entry is
          <strong> reversible</strong> — Undo restores a changed field or soft-deletes a created record.
        </p>
      </div>

      {msg && <div className="mb-3 p-2 text-xs bg-gray-50 border border-gray-200 rounded font-mono break-all">{msg}</div>}

      <div className="bg-white rounded-lg shadow-sm overflow-x-auto" style={{ border: '1px solid #e5e7eb' }}>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs text-gray-400 border-b" style={{ borderColor: '#f1f5f9' }}>
            <th className="py-2 px-3">Action</th><th>Target</th><th>Before</th><th>After</th>
            <th>Source</th><th>State</th><th>Undo</th>
          </tr></thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={7} className="py-6 text-center text-gray-400 text-xs">No actions recorded yet.</td></tr>
            ) : entries.map(e => (
              <tr key={e.id} className="border-t align-top" style={{ borderColor: '#f1f5f9' }}>
                <td className="py-2 px-3 font-medium text-gray-800">{e.action_type}</td>
                <td className="text-xs text-gray-600">{e.target_entity}</td>
                <td className="text-xs text-gray-500 max-w-[12rem] truncate" title={fmt(e.before)}>{fmt(e.before)}</td>
                <td className="text-xs text-gray-500 max-w-[12rem] truncate" title={fmt(e.after)}>{fmt(e.after)}</td>
                <td className="text-xs text-gray-600 truncate max-w-[10rem]" title={e.source}>{e.source || '—'}</td>
                <td>
                  {e.reversed
                    ? <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>reversed</span>
                    : <span className="text-[10px] px-1.5 py-0.5 rounded text-white" style={{ background: '#01411C' }}>applied</span>}
                </td>
                <td>
                  {!e.reversed && e.reversible
                    ? <button onClick={() => undo(e.id)} disabled={busy}
                        className="text-[11px] px-2 py-0.5 rounded text-white disabled:opacity-50" style={{ background: '#dc2626' }}>Undo</button>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
