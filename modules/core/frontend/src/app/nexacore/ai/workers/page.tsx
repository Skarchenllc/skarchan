'use client';

import { useEffect, useState } from 'react';
import { Cap, Mod, AUTONOMY, TIERS, authHeaders, getJSON } from '@/components/ai/kit';

// Workers — hire a specialist per section; it earns autonomy as its track record improves.
export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [modules, setModules] = useState<Mod[]>([]);
  const [caps, setCaps] = useState<Cap[]>([]);
  const [workerForm, setWorkerForm] = useState<any | null>(null);

  const reloadWorkers = async () => setWorkers((await getJSON('/api/v1/ai/workers'))?.data || []);
  useEffect(() => {
    reloadWorkers();
    getJSON('/api/v1/development/modules-with-entity-types').then((md) => setModules(Array.isArray(md) ? md : md?.data || []));
    getJSON('/api/v1/ai/capabilities').then((cp) => setCaps(cp?.data || []));
  }, []);

  // Capabilities applicable to a section (non-manager). Used for the "owns" picker.
  const capsFor = (entity: string) =>
    caps.filter((c) => (c as any).mode !== 'manager' && (c.applies_to.includes('*') || c.applies_to.includes(entity)));
  // A unit manager (pseudo-section "__manager__") owns the manager-mode capabilities.
  const MANAGER_ET = '__manager__';
  const managerCaps = caps.filter((c) => (c as any).mode === 'manager');
  const ownableCaps = (entity: string) => (entity === MANAGER_ET ? managerCaps : capsFor(entity));
  const capName = (id: string) => caps.find((c) => c.id === id)?.name || id;
  const toggleOwn = (id: string) => setWorkerForm((f: any) => {
    const owned = new Set<string>(f.capabilities || []);
    owned.has(id) ? owned.delete(id) : owned.add(id);
    return { ...f, capabilities: Array.from(owned) };
  });

  const saveWorker = async () => {
    if (!workerForm?.module_code || !workerForm?.entity_type) return;
    await fetch('/api/v1/ai/workers', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(workerForm) });
    setWorkerForm(null);
    await reloadWorkers();
  };
  const deleteWorker = async (id: string) => { await fetch(`/api/v1/ai/workers/${id}`, { method: 'DELETE', headers: authHeaders() }); await reloadWorkers(); };
  const promoteWorker = async (id: string) => { await fetch(`/api/v1/ai/workers/${id}/promote`, { method: 'POST', headers: authHeaders() }); await reloadWorkers(); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Hire a specialist for a section. The worker gives its capabilities a role and persona, and earns autonomy as its track record improves.
        </p>
        <button className="ai-plan-btn text-sm"
          onClick={() => setWorkerForm({ module_code: '', entity_type: '', name: '', role: '', persona: '', autonomy: 'suggest', model_tier: '', enabled: true })}>
          + Hire a worker
        </button>
      </div>

      {workerForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={workerForm.module_code}
              onChange={(e) => setWorkerForm({ ...workerForm, module_code: e.target.value, entity_type: '' })}>
              <option value="">Module…</option>
              {modules.map((m) => <option key={m.module_code} value={m.module_code}>{m.module_label}</option>)}
            </select>
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={workerForm.entity_type}
              onChange={(e) => setWorkerForm({ ...workerForm, entity_type: e.target.value, capabilities: [] })}>
              <option value="">Section…</option>
              {workerForm.module_code && <option value={MANAGER_ET}>🧑‍💼 Unit Manager (whole module)</option>}
              {(modules.find((m) => m.module_code === workerForm.module_code)?.components || [])
                .map((c) => <option key={c.component_code} value={c.component_code}>{c.component_label}</option>)}
            </select>
            <input className="text-sm px-2 py-1 border border-gray-300 rounded" placeholder="Name (e.g. Ada)"
              value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} />
            <input className="text-sm px-2 py-1 border border-gray-300 rounded" placeholder="Role (e.g. accountant)"
              value={workerForm.role} onChange={(e) => setWorkerForm({ ...workerForm, role: e.target.value })} />
          </div>
          <textarea className="w-full text-sm px-2 py-1 border border-gray-300 rounded" rows={2}
            placeholder="Persona / how this specialist should think and behave…"
            value={workerForm.persona} onChange={(e) => setWorkerForm({ ...workerForm, persona: e.target.value })} />

          {workerForm.entity_type && (
            <div>
              <div className="text-xs text-gray-500 mb-1">
                {workerForm.entity_type === MANAGER_ET
                  ? <>Manager skills <span className="text-gray-400">— its persona flavors how it plans &amp; briefs. None = all.</span></>
                  : <>Owns capabilities <span className="text-gray-400">— its persona &amp; autonomy apply only to these. None selected = all.</span></>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ownableCaps(workerForm.entity_type).map((cap) => {
                  const owned = (workerForm.capabilities || []).includes(cap.id);
                  return (
                    <button key={cap.id} type="button" onClick={() => toggleOwn(cap.id)}
                      className="text-xs px-2 py-1 rounded-full border"
                      style={owned
                        ? { backgroundColor: '#5147e6', color: '#fff', borderColor: '#5147e6' }
                        : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#d1d5db' }}>
                      {cap.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Autonomy</span>
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={workerForm.autonomy}
              onChange={(e) => setWorkerForm({ ...workerForm, autonomy: e.target.value })}>
              {AUTONOMY.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <span className="text-gray-500 ml-2">Model</span>
            <select className="text-sm px-2 py-1 border border-gray-300 rounded" value={workerForm.model_tier || ''}
              onChange={(e) => setWorkerForm({ ...workerForm, model_tier: e.target.value })}>
              <option value="">default</option>
              {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="flex-1" />
            <button className="text-sm px-3 py-1.5" onClick={() => setWorkerForm(null)}>Cancel</button>
            <button className="ai-plan-btn text-sm" onClick={saveWorker}>Save worker</button>
          </div>
        </div>
      )}

      {workers.length === 0 && !workerForm && (
        <div className="text-sm text-gray-400 py-8 text-center">No workers yet. Hire one to give a section its own specialist.</div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        {workers.filter((w) => !['__ceo__', '__division__'].includes(w.entity_type)).map((w) => (
          <div key={w.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900 flex items-center gap-2">
                  {w.name} <span className="text-xs font-normal text-gray-400">· {w.role}</span>
                  {w.entity_type === MANAGER_ET && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>🧑‍💼 Manager</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{w.entity_type === MANAGER_ET ? `${w.module_code} · unit manager` : `${w.module_code}/${w.entity_type}`}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>{w.autonomy}</span>
            </div>
            {w.persona && <p className="text-sm text-gray-600 mt-1">{w.persona}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-gray-400">Owns:</span>
              {(w.capabilities || []).length === 0
                ? <span className="text-[11px] text-gray-500">all capabilities</span>
                : (w.capabilities as string[]).map((id) => (
                    <span key={id} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>{capName(id)}</span>
                  ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              {w.quality ? (
                <span>track record: {w.quality.approval != null ? `${Math.round(w.quality.approval * 100)}% approval` : 'no ratings'} · {w.quality.corrections} corrections · {w.quality.total} signals</span>
              ) : <span>no feedback yet</span>}
            </div>
            {w.promotion?.eligible && (
              <div className="mt-2 flex items-center justify-between gap-2 rounded p-2" style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                <span className="text-xs" style={{ color: '#065f46' }}>Ready to promote to <b>{w.promotion.recommended}</b> — {w.promotion.reasons[0]}</span>
                <button className="ai-plan-btn text-xs" onClick={() => promoteWorker(w.id)}>Promote</button>
              </div>
            )}
            {w.promotion && !w.promotion.eligible && !w.promotion.at_top && (
              <div className="mt-2 text-xs text-gray-400">Toward {w.promotion.recommended}: {w.promotion.reasons[0]}</div>
            )}
            <div className="flex justify-end gap-3 mt-2 text-xs">
              <button className="underline text-gray-500" onClick={() => setWorkerForm({ ...w })}>Edit</button>
              <button className="underline text-red-600" onClick={() => deleteWorker(w.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
