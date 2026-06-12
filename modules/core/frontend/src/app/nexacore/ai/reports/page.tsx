'use client';

import { useCallback, useEffect, useState } from 'react';
import { authHeaders, getJSON } from '@/components/ai/kit';

// Reports — the saved decision notes from the Meeting Room (synthesised answers
// with findings + recommendations). Browse, expand, copy, or delete.
interface Report { id: string; created_at?: string; [k: string]: any }

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await getJSON('/api/v1/development/entity-records?entity_type=ai_reports&limit=100');
    const rows = (r?.data || []).map((x: any) => ({ id: x.id, created_at: x.created_at, ...x.data }));
    rows.sort((a: Report, b: Report) => (b.created_at || '').localeCompare(a.created_at || ''));
    setReports(rows);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!window.confirm('Delete this report?')) return;
    await fetch(`/api/v1/development/entity-records/${id}?deleted_by=00000000-0000-0000-0000-000000000001`, { method: 'DELETE', headers: authHeaders() });
    setReports((p) => p.filter((r) => r.id !== id));
  };
  const copy = async (r: Report) => {
    const find = (r.key_findings || []).map((f: string) => `• ${f}`).join('\n');
    const recs = (r.recommendations || []).map((x: any, i: number) => `${i + 1}. ${x.action} — ${x.why}`).join('\n');
    const gaps = (r.data_gaps || []).map((g: string) => `• ${g}`).join('\n');
    const text = `${r.title}\n\n${r.summary}\n\nKey findings:\n${find}\n\nRecommendations:\n${recs}${gaps ? `\n\nData gaps:\n${gaps}` : ''}`;
    try { await navigator.clipboard.writeText(text); } catch { /* noop */ }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2">
        <button onClick={load} className="text-[11px] underline text-gray-400 shrink-0">refresh</button>
      </div>

      {loading && <div className="text-sm text-gray-400 py-10 text-center">Loading…</div>}
      {!loading && reports.length === 0 && (
        <div className="text-sm text-gray-400 py-12 text-center">
          No saved reports yet. Brief the CEO or a manager in the Meeting Room, then press <strong>💾 Save</strong> on the decision note.
        </div>
      )}

      {reports.map((r) => {
        const isOpen = open[r.id];
        return (
          <div key={r.id} className="bg-white border border-gray-200 rounded-lg">
            <button onClick={() => setOpen((p) => ({ ...p, [r.id]: !isOpen }))} className="w-full text-left px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{r.title || 'Untitled report'}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">
                  {(r.created_at || '').slice(0, 16).replace('T', ' ')}{r.scope ? ` · ${r.scope}` : ''}{r.instruction ? ` · “${String(r.instruction).slice(0, 70)}”` : ''}
                </div>
                {!isOpen && r.summary && <div className="text-sm text-gray-600 mt-1 line-clamp-2">{r.summary}</div>}
              </div>
              <span className="text-gray-300 text-sm shrink-0 mt-1">{isOpen ? '▾' : '▸'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                <p className="text-sm text-gray-700">{r.summary}</p>
                {(r.key_findings || []).length > 0 && (
                  <div className="mt-3"><div className="text-xs font-semibold text-gray-500">Key findings</div>
                    <ul className="list-disc ml-5 text-sm text-gray-700 mt-0.5">{r.key_findings.map((f: string, i: number) => <li key={i}>{f}</li>)}</ul></div>
                )}
                {(r.recommendations || []).length > 0 && (
                  <div className="mt-3"><div className="text-xs font-semibold text-gray-500">Recommendations</div>
                    <ol className="list-decimal ml-5 text-sm text-gray-700 mt-0.5 space-y-0.5">{r.recommendations.map((x: any, i: number) => <li key={i}><strong>{x.action}</strong> <span className="text-gray-500">— {x.why}</span></li>)}</ol></div>
                )}
                {(r.data_gaps || []).length > 0 && (
                  <div className="mt-3"><div className="text-xs font-semibold" style={{ color: '#b45309' }}>⚠ Data gaps</div>
                    <ul className="list-disc ml-5 text-sm text-gray-600 mt-0.5">{r.data_gaps.map((g: string, i: number) => <li key={i}>{g}</li>)}</ul></div>
                )}
                <div className="flex gap-3 mt-3">
                  <button onClick={() => copy(r)} className="text-xs px-3 py-1.5 border border-gray-300 rounded">🔗 Copy</button>
                  <button onClick={() => del(r.id)} className="text-xs underline text-red-600">Delete</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
