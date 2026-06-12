'use client';

import { useEffect, useState, useCallback } from 'react';

const SYS_USER = '00000000-0000-0000-0000-000000000001';
const STAGES = ['Prospecting', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const STAGE_COLOR: Record<string, string> = {
  'Prospecting': '#64748b', 'Qualified': '#5147e6', 'Proposal': '#7c3aed',
  'Negotiation': '#d97706', 'Closed Won': '#01411C', 'Closed Lost': '#dc2626',
};

interface Opp { id: string; data: Record<string, any>; }

const money = (v: any) => {
  const n = Number(v) || 0;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
};

export default function SalesPipelinePage() {
  const [opps, setOpps] = useState<Opp[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/v1/development/entity-records?entity_type=opportunities&limit=500');
      const j = await r.json();
      setOpps((j.data || []).map((rec: any) => ({ id: rec.id, data: rec.data || {} })));
    } catch { setOpps([]); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const stageOf = (o: Opp) => STAGES.includes(o.data.stage) ? o.data.stage : STAGES[0];

  async function moveTo(id: string, stage: string) {
    const opp = opps.find(o => o.id === id);
    if (!opp || stageOf(opp) === stage) return;
    const prev = opp.data.stage;
    // optimistic
    setOpps(list => list.map(o => o.id === id ? { ...o, data: { ...o.data, stage } } : o));
    try {
      await fetch(`/api/v1/development/entity-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { ...opp.data, stage }, last_modified_by: SYS_USER }),
      });
    } catch {
      // revert on failure
      setOpps(list => list.map(o => o.id === id ? { ...o, data: { ...o.data, stage: prev } } : o));
    }
  }

  const grouped = (stage: string) => opps.filter(o => stageOf(o) === stage);
  const sum = (stage: string) => grouped(stage).reduce((t, o) => t + (Number(o.data.amount) || 0), 0);
  const total = opps.reduce((t, o) => t + (Number(o.data.amount) || 0), 0);
  const openTotal = opps.filter(o => !['Closed Won', 'Closed Lost'].includes(stageOf(o)))
    .reduce((t, o) => t + (Number(o.data.amount) || 0), 0);

  return (
    <div className="px-1">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Pipeline</h2>
          <p className="text-xs text-gray-500">
            {opps.length} opportunities · {money(openTotal)} open · {money(total)} total — drag a card to change stage
          </p>
        </div>
        <a href="/sales/opportunities/new"
           className="px-3 py-1.5 text-sm font-semibold text-white" style={{ backgroundColor: '#5147e6' }}>
          + New Opportunity
        </a>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500 py-10 text-center">Loading pipeline…</div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div
              key={stage}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage); }}
              onDragLeave={() => setOverStage(s => s === stage ? null : s)}
              onDrop={(e) => { e.preventDefault(); if (dragId) moveTo(dragId, stage); setDragId(null); setOverStage(null); }}
              className="flex-shrink-0 w-64 rounded-lg"
              style={{ background: overStage === stage ? '#eef2ff' : '#f8fafc', border: '1px solid #e5e7eb' }}
            >
              <div className="px-3 py-2 border-b" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full" style={{ background: STAGE_COLOR[stage] }} />
                  <span className="text-sm font-semibold text-gray-800">{stage}</span>
                  <span className="ml-auto text-xs text-gray-500">{grouped(stage).length}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{money(sum(stage))}</div>
              </div>
              <div className="p-2 space-y-2 min-h-[120px]">
                {grouped(stage).map(o => (
                  <div
                    key={o.id}
                    draggable
                    onDragStart={() => setDragId(o.id)}
                    onDragEnd={() => { setDragId(null); setOverStage(null); }}
                    className="bg-white rounded-md p-2.5 shadow-sm cursor-move"
                    style={{ border: '1px solid #e5e7eb', opacity: dragId === o.id ? 0.5 : 1 }}
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {o.data.name || o.data.subject || 'Untitled'}
                    </div>
                    {(o.data.account_name) && (
                      <div className="text-xs text-gray-500 truncate">{o.data.account_name}</div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs font-semibold" style={{ color: STAGE_COLOR[stage] }}>
                        {money(o.data.amount)}
                      </span>
                      {o.data.priority && (
                        <span className="text-[10px] uppercase tracking-wide text-gray-400">{o.data.priority}</span>
                      )}
                    </div>
                  </div>
                ))}
                {grouped(stage).length === 0 && (
                  <div className="text-xs text-gray-400 text-center py-6">Drop here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
