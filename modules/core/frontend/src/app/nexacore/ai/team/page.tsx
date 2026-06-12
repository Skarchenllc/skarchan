'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Avatar, Cap, MicButton, Mod, Setting, authHeaders, getJSON, keyOf } from '@/components/ai/kit';

// Team — your AI staff as a company org chart. CEO → department heads →
// department managers → section experts. Every real module and section is
// listed, so you can assign a manager for a whole department or an expert for
// any section. "Train" each worker on one screen: character, skills, and trust.
// This replaces the old Workers + Capabilities + Sections pages.

const CEO = { module: '__org__', entity: '__ceo__' };
const MGR_ET = '__manager__';

const TRUST = [
  { key: 'suggest', label: 'Suggest only', hint: 'Drafts ideas — never changes your data on its own.' },
  { key: 'review', label: 'Needs my approval', hint: 'Prepares changes, then waits for your sign-off in Approvals.' },
  { key: 'auto', label: 'Acts on its own', hint: 'Applies low-risk changes automatically (policy still guards the risky ones).' },
];

// Customer-facing departments (used by the "External team" preset).
const EXTERNAL_MODULES = ['sales', 'marketing', 'customer-service', 'ecommerce', 'contacts'];

// Prebuilt personas — one click instead of a blank textarea.
const PERSONA_TEMPLATES = [
  { label: 'Careful & compliant', text: 'Careful and compliance-minded. Double-checks details, follows policy, and flags anything unusual before acting.' },
  { label: 'Customer-obsessed', text: 'Customer-obsessed and responsive. Resolves issues fast, protects satisfaction, and escalates only what truly matters.' },
  { label: 'Fast & decisive', text: 'Fast and decisive. Prioritises the highest-impact work and keeps things moving without overthinking.' },
  { label: 'Methodical analyst', text: 'Methodical and analytical. Looks for patterns, surfaces risks early, and backs conclusions with the data.' },
  { label: 'Friendly & clear', text: 'Friendly, clear, and concise. Communicates in plain language and keeps people informed.' },
];

export default function TeamPage() {
  const [divRaw, setDivRaw] = useState<any[]>([]);
  const [ceoName, setCeoName] = useState<string | null>(null);
  const [workers, setWorkers] = useState<any[]>([]);
  const [modules, setModules] = useState<Mod[]>([]);
  const [caps, setCaps] = useState<Cap[]>([]);
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [openMod, setOpenMod] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [train, setTrain] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bulkBusy, setBulkBusy] = useState<string | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dv, wk, md, cp, sg] = await Promise.all([
        getJSON('/api/v1/ai/divisions'),
        getJSON('/api/v1/ai/workers'),
        getJSON('/api/v1/development/modules-with-entity-types'),
        getJSON('/api/v1/ai/capabilities'),
        getJSON('/api/v1/ai/settings'),
      ]);
      setDivRaw(dv?.data || []);
      setCeoName(dv?.ceo || null);
      setWorkers(wk?.data || []);
      setModules(Array.isArray(md) ? md : md?.data || []);
      setCaps(cp?.data || []);
      const map: Record<string, Setting> = {};
      for (const s of (sg?.data || [])) map[keyOf(s.module_code, s.entity_type)] = s;
      setSettings(map);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const modMap = useMemo(() => Object.fromEntries(modules.map((m) => [m.module_code, m])), [modules]);
  const workerAt = useCallback((module: string, entity: string) =>
    workers.find((w) => w.module_code === module && w.entity_type === entity) || null, [workers]);

  // A flat list of every department (module), ordered by division for sanity but
  // not grouped — each department holds its own sections.
  const orderedModules: string[] = useMemo(() => {
    const order: string[] = []; const seen = new Set<string>();
    for (const d of divRaw) for (const c of (d.modules || [])) if (modMap[c] && !seen.has(c)) { seen.add(c); order.push(c); }
    for (const m of modules) if (!seen.has(m.module_code)) { seen.add(m.module_code); order.push(m.module_code); }
    return order;
  }, [divRaw, modules, modMap]);

  const q = query.trim().toLowerCase();
  const moduleLabel = (code: string) => modMap[code]?.module_label || code;
  const sectionsOf = (code: string) => modMap[code]?.components || [];
  const moduleMatches = useCallback((code: string) => {
    if (!q) return true;
    const m = modMap[code]; if (!m) return false;
    return m.module_label.toLowerCase().includes(q) || m.components.some((c) => c.component_label.toLowerCase().includes(q));
  }, [q, modMap]);
  const visibleSections = useCallback((code: string) => {
    const comps = sectionsOf(code);
    if (!q || moduleLabel(code).toLowerCase().includes(q)) return comps;
    return comps.filter((c) => c.component_label.toLowerCase().includes(q));
  }, [q, modMap]);

  // --- Bulk staffing + onboarding presets (additive; individual flows stay) ----
  const putWorker = (body: any) =>
    fetch('/api/v1/ai/workers', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
  const enableSection = (m: string, et: string) => {
    const cur = settings[keyOf(m, et)];
    return fetch('/api/v1/ai/settings', {
      method: 'PUT', headers: authHeaders(),
      body: JSON.stringify({ module_code: m, entity_type: et, enabled: true, model_tier: (cur as any)?.model_tier ?? null, capabilities: cur?.capabilities || {} }),
    });
  };
  const mkManager = (code: string) => putWorker({
    module_code: code, entity_type: MGR_ET, name: `${moduleLabel(code)} Manager`, role: `${moduleLabel(code)} Manager`,
    persona: `Runs the ${moduleLabel(code)} department — oversees its work, answers questions, and flags what needs attention.`,
    autonomy: 'review', capabilities: [], enabled: true,
  });
  const mkSpecialist = async (code: string, c: any) => {
    await putWorker({
      module_code: code, entity_type: c.component_code, name: `${c.component_label} Specialist`, role: `${c.component_label.toLowerCase()} specialist`,
      persona: `Specialist for the ${c.component_label} section in ${moduleLabel(code)} — handles it in detail and surfaces issues early.`,
      autonomy: 'review', capabilities: [], enabled: true,
    });
    await enableSection(code, c.component_code);
  };

  const staffDepartment = async (code: string) => {
    const unstaffed = sectionsOf(code).filter((c) => !workerAt(code, c.component_code));
    const needMgr = !workerAt(code, MGR_ET);
    if (!unstaffed.length && !needMgr) { window.alert(`${moduleLabel(code)} is already fully staffed.`); return; }
    if (!window.confirm(`Staff ${moduleLabel(code)}? Appoints a specialist for ${unstaffed.length} section${unstaffed.length === 1 ? '' : 's'}${needMgr ? ' plus a department manager' : ''}, and turns AI on for them.`)) return;
    setBulkBusy(code);
    try {
      if (needMgr) await mkManager(code);
      for (const c of unstaffed) await mkSpecialist(code, c);
      await load();
    } finally { setBulkBusy(null); }
  };

  const applyPreset = async (kind: string) => {
    setSetupOpen(false);
    if (kind === 'clear') {
      if (!window.confirm(`Remove ALL ${workers.length} team members? You can rebuild from a preset afterwards.`)) return;
      setBulkBusy('preset');
      try { await Promise.all(workers.map((w) => fetch(`/api/v1/ai/workers/${w.id}`, { method: 'DELETE', headers: authHeaders() }))); await load(); }
      finally { setBulkBusy(null); }
      return;
    }
    const labels: Record<string, string> = { solo: 'Solo — just a CEO', managers: 'A manager for every department', external: 'Managers + specialists for external departments' };
    if (!window.confirm(`Set up: ${labels[kind]}? This adds any missing members; it won’t remove existing ones.`)) return;
    setBulkBusy('preset');
    try {
      if (!workerAt('__org__', '__ceo__')) await putWorker({ module_code: '__org__', entity_type: '__ceo__', name: 'Chief Executive', role: 'CEO', persona: 'Oversees the whole company. Sets direction, protects priorities, and approves what matters.', autonomy: 'review', capabilities: [], enabled: true });
      if (kind !== 'solo') {
        for (const code of orderedModules) if (!workerAt(code, MGR_ET)) await mkManager(code);
      }
      if (kind === 'external') {
        for (const code of EXTERNAL_MODULES) for (const c of sectionsOf(code)) if (!workerAt(code, c.component_code)) await mkSpecialist(code, c);
      }
      await load();
    } finally { setBulkBusy(null); }
  };

  const total = workers.length;
  if (loading) return <div className="text-sm text-gray-500 py-12 text-center">Loading your team…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="text-sm text-gray-500 max-w-2xl">
          Your AI staff, organised like a company. Assign a <strong>manager</strong> to run a whole department, or an
          <strong> expert</strong> to any section. <strong>Train</strong> each one on a single screen — character, skills,
          and how much you trust them. Instruct them in the <a className="underline" href="/nexacore/ai/boardroom" style={{ color: '#5147e6' }}>Meeting Room</a>;
          approve their work in <a className="underline" href="/nexacore/ai/review" style={{ color: '#5147e6' }}>Approvals</a>.
          {total > 0 && <> {total} on staff.</>}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a department or section…"
            className="text-sm px-3 py-1.5 border border-gray-300 rounded w-44" />
          <div className="relative">
            <button onClick={() => setSetupOpen((v) => !v)} disabled={!!bulkBusy}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded whitespace-nowrap disabled:opacity-50">
              {bulkBusy === 'preset' ? 'Setting up…' : 'Quick setup ▾'}
            </button>
            {setupOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 w-64 text-sm overflow-hidden">
                <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide text-gray-400">Set up a team (adds missing)</div>
                <button onClick={() => applyPreset('solo')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">🏢 Solo — just a CEO</button>
                <button onClick={() => applyPreset('managers')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">🧑‍💼 A manager per department</button>
                <button onClick={() => applyPreset('external')} className="block w-full text-left px-3 py-2 hover:bg-gray-50">🧑 + Specialists for external depts</button>
                <button onClick={() => applyPreset('clear')} className="block w-full text-left px-3 py-2 hover:bg-gray-50 text-red-600 border-t border-gray-100">🗑 Clear the whole team</button>
              </div>
            )}
          </div>
          <button onClick={() => setTrain(makeBlank())} className="ai-plan-btn text-sm whitespace-nowrap">+ Add member</button>
        </div>
      </div>

      {/* CEO */}
      <div className="bg-white border-2 rounded-lg px-4 py-3 flex items-center justify-between gap-2" style={{ borderColor: '#5147e6' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={ceoName || workerAt(CEO.module, CEO.entity)?.name} src={workerAt(CEO.module, CEO.entity)?.avatar} kind="ceo" size={36} />
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">{ceoName || workerAt(CEO.module, CEO.entity)?.name || 'No CEO yet'}</div>
            <div className="text-[11px] text-gray-400">CEO · directs the whole company</div>
          </div>
        </div>
        <PersonChip name={ceoName || workerAt(CEO.module, CEO.entity)?.name} role="CEO" kind="ceo" src={workerAt(CEO.module, CEO.entity)?.avatar}
          autonomy={workerAt(CEO.module, CEO.entity)?.autonomy} promote={workerAt(CEO.module, CEO.entity)?.promotion?.eligible}
          onClick={() => setTrain(makeForm(workerAt(CEO.module, CEO.entity), CEO.module, CEO.entity, 'CEO', 'ceo'))} />
      </div>

      {orderedModules.filter(moduleMatches).map((code) => {
        const mgr = workerAt(code, MGR_ET);
        const mopen = openMod[code] || !!q;
        const secs = visibleSections(code);
        const staffedSec = sectionsOf(code).filter((s) => workerAt(code, s.component_code)).length;
        return (
          <div key={code} className="bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3 gap-2">
              <button onClick={() => setOpenMod((p) => ({ ...p, [code]: !openMod[code] }))} className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400">{mopen ? '▾' : '▸'}</span>
                <span className="text-base">🏛️</span>
                <span className="font-semibold text-gray-900 truncate">{moduleLabel(code)}</span>
                <span className="text-xs text-gray-400">· {sectionsOf(code).length} sections{staffedSec ? ` · ${staffedSec} expert${staffedSec > 1 ? 's' : ''}` : ''}</span>
              </button>
              <div className="flex items-center gap-2 shrink-0">
                {sectionsOf(code).some((c) => !workerAt(code, c.component_code)) && (
                  <button onClick={(e) => { e.stopPropagation(); staffDepartment(code); }} disabled={bulkBusy === code}
                    className="text-[10px] underline disabled:opacity-50" style={{ color: '#5147e6' }}>
                    {bulkBusy === code ? 'Staffing…' : 'Staff all'}
                  </button>
                )}
                <PersonChip name={mgr?.name} role={mgr?.role || `${moduleLabel(code)} Manager`} autonomy={mgr?.autonomy} kind="manager"
                  src={mgr?.avatar} promote={mgr?.promotion?.eligible}
                  onClick={() => setTrain(makeForm(mgr, code, MGR_ET, `${moduleLabel(code)} Manager`, 'manager'))} />
              </div>
            </div>

            {mopen && (
              <div className="border-t border-gray-100 px-4 py-3 grid sm:grid-cols-2 gap-1.5">
                {secs.length === 0 && <div className="text-[11px] text-gray-400">No sections.</div>}
                {secs.map((c) => {
                  const ex = workerAt(code, c.component_code);
                  const on = !!settings[keyOf(code, c.component_code)]?.enabled;
                  return (
                    <button key={c.component_code}
                      onClick={() => setTrain(makeForm(ex, code, c.component_code, `${c.component_label} Specialist`, 'expert', on))}
                      className="flex items-center justify-between gap-2 text-left px-2 py-1.5 rounded border hover:bg-gray-50"
                      style={{ borderColor: '#f1f5f9' }}>
                      <span className="text-[12px] text-gray-700 truncate">{c.component_label}</span>
                      {ex
                        ? <span className="text-[10px] pl-0.5 pr-1.5 py-0.5 rounded-full whitespace-nowrap inline-flex items-center gap-1" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}><Avatar name={ex.name} src={ex.avatar} kind="expert" size={14} /> {ex.name}{ex.promotion?.eligible ? ' ✨' : ''}</span>
                        : <span className="text-[10px] whitespace-nowrap" style={{ color: on ? '#9ca3af' : '#5147e6' }}>{on ? 'no expert' : '+ assign'}</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {train && (
        <TrainDrawer form={train} caps={caps} settings={settings} modules={modules}
          sectionLabel={(m, s) => modMap[m]?.components.find((c) => c.component_code === s)?.component_label || s}
          onClose={() => setTrain(null)} onSaved={async () => { setTrain(null); await load(); }} />
      )}
    </div>
  );
}

// A blank profile for the "+ Add member" flow — the drawer shows a slot picker
// (department, then Manager or a Section) before the usual character/skills/trust.
function makeBlank() {
  return {
    id: null, module_code: '', entity_type: '', tier: '', name: '', role: '', persona: '',
    autonomy: 'review', capabilities: [], enabled: true, sectionEnabled: true, existing: false, pick: true,
  };
}

function makeForm(worker: any, module: string, entity: string, defaultRole: string, tier: string, sectionEnabled = false) {
  return {
    id: worker?.id || null,
    module_code: module, entity_type: entity, tier,
    name: worker?.name || '', role: worker?.role || defaultRole,
    persona: worker?.persona || '',
    avatar: worker?.avatar || '',
    autonomy: worker?.autonomy || 'review',
    capabilities: worker?.capabilities || [],
    enabled: worker?.enabled ?? true,
    sectionEnabled: tier === 'expert' ? (worker ? true : sectionEnabled) : true,
    existing: !!worker,
    quality: worker?.quality || null,
    promotion: worker?.promotion || null,
  };
}

const trustLabel = (a?: string) => TRUST.find((t) => t.key === a)?.label || a || '';

function PersonChip({ name, role, autonomy, kind = 'expert', src, promote, onClick }:
  { name?: string; role?: string; autonomy?: string; kind?: 'ceo' | 'manager' | 'expert'; src?: string; promote?: boolean; onClick: () => void }) {
  const senior = kind === 'manager' || kind === 'ceo';
  if (!name) {
    return <button onClick={onClick} className="text-[11px] underline shrink-0" style={{ color: '#5147e6' }}>+ Assign {kind === 'manager' ? 'manager' : role?.toLowerCase()}</button>;
  }
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 shrink-0 px-1 py-1 rounded hover:bg-gray-50">
      <span className="text-[11px] pl-0.5 pr-2 py-0.5 rounded-full inline-flex items-center gap-1" style={{ backgroundColor: senior ? '#fef3c7' : '#eef2ff', color: senior ? '#92400e' : '#3730a3' }}>
        <Avatar name={name} src={src} kind={kind} size={16} /> {name}
      </span>
      {promote && <span title="Earned more trust — ready to promote" className="text-[10px]">✨</span>}
      <span className="text-[10px] text-gray-400">{trustChip(autonomy)}</span>
      <span className="text-[11px] text-gray-300">Train ›</span>
    </button>
  );
}
const trustChip = (a?: string) => a === 'auto' ? 'acts alone' : a === 'suggest' ? 'suggests' : 'needs approval';

function TrainDrawer({ form, caps, settings, modules, sectionLabel, onClose, onSaved }:
  { form: any; caps: Cap[]; settings: Record<string, Setting>; modules: Mod[]; sectionLabel: (m: string, s: string) => string; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<any>(form);
  const [skills, setSkills] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const modLabel = (code: string) => modules.find((m) => m.module_code === code)?.module_label || code;
  const modSections = (code: string) => modules.find((m) => m.module_code === code)?.components || [];

  const isExpert = f.tier === 'expert';
  const isManager = f.tier === 'manager';
  const applicable = useMemo(() => {
    if (isManager) return caps.filter((c) => (c as any).mode === 'manager');
    if (f.tier === 'ceo' || f.tier === 'head') return [];
    return caps.filter((c) => (c as any).mode !== 'manager' && (c.applies_to.includes('*') || c.applies_to.includes(f.entity_type)));
  }, [caps, f.entity_type, f.tier, isManager]);

  useEffect(() => {
    const init: Record<string, boolean> = {};
    if (isExpert) {
      const sec = settings[keyOf(f.module_code, f.entity_type)];
      for (const c of applicable) {
        const cc = sec?.capabilities?.[c.id];
        init[c.id] = f.sectionEnabled ? (cc?.enabled === undefined ? true : cc.enabled) : true;
      }
    } else {
      const owned = new Set<string>(f.capabilities || []);
      for (const c of applicable) init[c.id] = owned.size === 0 || owned.has(c.id);
    }
    setSkills(init);
  }, [applicable, isExpert, f.module_code, f.entity_type, f.sectionEnabled, f.capabilities, settings]);

  const toggleSkill = (id: string) => setSkills((s) => ({ ...s, [id]: !s[id] }));

  const save = async () => {
    if (!f.module_code || !f.entity_type) { setErr('Pick a department (and section, for a specialist) first.'); return; }
    if (!f.name.trim()) { setErr('Give them a name first.'); return; }
    setBusy(true); setErr(null);
    try {
      const owned = isExpert ? [] : applicable.filter((c) => skills[c.id]).map((c) => c.id);
      const wbody = {
        module_code: f.module_code, entity_type: f.entity_type,
        name: f.name, role: f.role, persona: f.persona, avatar: f.avatar || '',
        autonomy: f.autonomy, capabilities: owned, enabled: f.enabled,
      };
      const wr = await fetch('/api/v1/ai/workers', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(wbody) });
      if (!wr.ok) throw new Error(wr.status === 401 || wr.status === 403 ? 'Sign in as an admin to manage the team.' : `Save failed (${wr.status}).`);

      if (isExpert) {
        const cur = settings[keyOf(f.module_code, f.entity_type)];
        const capMap: Record<string, any> = { ...(cur?.capabilities || {}) };
        for (const c of applicable) capMap[c.id] = { ...(capMap[c.id] || {}), enabled: !!skills[c.id] };
        const sbody = {
          module_code: f.module_code, entity_type: f.entity_type,
          enabled: f.enabled, model_tier: (cur as any)?.model_tier ?? null, capabilities: capMap,
        };
        await fetch('/api/v1/ai/settings', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(sbody) });
      }
      await onSaved();
    } catch (e: any) { setErr(e?.message || 'Save failed.'); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!f.id) return;
    if (!window.confirm(`Remove ${f.name} from the team?`)) return;
    setBusy(true);
    try { await fetch(`/api/v1/ai/workers/${f.id}`, { method: 'DELETE', headers: authHeaders() }); await onSaved(); }
    catch { setErr('Could not remove.'); } finally { setBusy(false); }
  };

  const promote = async () => {
    if (!f.id) return;
    setBusy(true); setErr(null);
    try {
      const r = await fetch(`/api/v1/ai/workers/${f.id}/promote`, { method: 'POST', headers: authHeaders() });
      if (!r.ok) { const b = await r.json().catch(() => ({})); throw new Error(b.detail || 'Not eligible to promote yet.'); }
      await onSaved();
    } catch (e: any) { setErr(e?.message || 'Promotion failed.'); } finally { setBusy(false); }
  };

  // Upload a local image → resize to a small square → store as a data URL in the
  // avatar field (no backend storage needed; kept tiny so it doesn't bloat the DB).
  const onUpload = (file: File) => {
    if (!file.type.startsWith('image/')) { setErr('Please choose an image file.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const S = 96, canvas = document.createElement('canvas');
        canvas.width = S; canvas.height = S;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, S, S);
        setF((p: any) => ({ ...p, avatar: canvas.toDataURL('image/jpeg', 0.82) }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };
  const uploaded = typeof f.avatar === 'string' && f.avatar.startsWith('data:');

  const where = isExpert ? sectionLabel(f.module_code, f.entity_type)
    : isManager ? `${f.module_code} department` : f.tier === 'head' ? 'department' : 'whole company';

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.25)' }} />
      <div className="relative bg-white h-full w-full max-w-md shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar name={f.name || f.role} src={f.avatar} kind={f.tier === 'ceo' ? 'ceo' : f.tier === 'manager' ? 'manager' : 'expert'} size={34} />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{f.existing ? 'Train' : f.pick ? 'Add member' : 'Assign'} · {f.role || 'New team member'}</div>
              <div className="text-[11px] text-gray-400">{f.module_code ? where : 'pick a department below'}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {f.pick && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Assign to</h4>
              <div className="space-y-2">
                <select value={f.module_code} className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                  onChange={(e) => setF({ ...f, module_code: e.target.value, entity_type: '', tier: '' })}>
                  <option value="">Choose a department…</option>
                  {modules.map((m) => <option key={m.module_code} value={m.module_code}>{m.module_label}</option>)}
                </select>
                {f.module_code && (
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setF({ ...f, entity_type: '__manager__', tier: 'manager', role: f.role || `${modLabel(f.module_code)} Manager` })}
                      className="flex-1 text-xs px-2 py-1.5 rounded border"
                      style={f.tier === 'manager' ? { background: '#5147e6', color: '#fff', borderColor: '#5147e6' } : { background: '#fff', color: '#475569', borderColor: '#d1d5db' }}>
                      🧑‍💼 Manager (whole department)
                    </button>
                    <button type="button" onClick={() => setF({ ...f, tier: 'expert', entity_type: '', role: '' })}
                      className="flex-1 text-xs px-2 py-1.5 rounded border"
                      style={f.tier === 'expert' ? { background: '#5147e6', color: '#fff', borderColor: '#5147e6' } : { background: '#fff', color: '#475569', borderColor: '#d1d5db' }}>
                      🧑 Specialist (a section)
                    </button>
                  </div>
                )}
                {f.tier === 'expert' && f.module_code && (
                  <select value={f.entity_type} className="w-full text-sm px-3 py-2 border border-gray-300 rounded"
                    onChange={(e) => {
                      const sec = e.target.value;
                      const lbl = modSections(f.module_code).find((c) => c.component_code === sec)?.component_label || sec;
                      setF({ ...f, entity_type: sec, role: f.role || `${lbl} Specialist` });
                    }}>
                    <option value="">Choose a section…</option>
                    {modSections(f.module_code).map((c) => <option key={c.component_code} value={c.component_code}>{c.component_label}</option>)}
                  </select>
                )}
              </div>
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Character</h4>
            <div className="space-y-2">
              <input className="w-full text-sm px-3 py-2 border border-gray-300 rounded" placeholder="Name (e.g. Taylor Brooks)"
                value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <input className="w-full text-sm px-3 py-2 border border-gray-300 rounded" placeholder="Role / job title"
                value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} />
              <textarea className="w-full text-sm px-3 py-2 border border-gray-300 rounded" rows={3}
                placeholder="How should they think and behave? e.g. “Careful and compliance-minded; flags anything unusual early.”"
                value={f.persona} onChange={(e) => setF({ ...f, persona: e.target.value })} />
              <div className="flex flex-wrap items-center gap-1.5">
                <MicButton size={26} onText={(t) => setF((p: any) => ({ ...p, persona: (p.persona ? p.persona + ' ' : '') + t }))} />
                <span className="text-[10px] text-gray-400">Templates:</span>
                {PERSONA_TEMPLATES.map((t) => (
                  <button key={t.label} type="button" onClick={() => setF({ ...f, persona: t.text })}
                    className="text-[10px] px-2 py-0.5 rounded-full border" style={{ borderColor: '#d1d5db', color: '#475569' }}>{t.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded" placeholder="Photo URL (optional — blank = generated face)"
                  value={uploaded ? '' : f.avatar} onChange={(e) => setF({ ...f, avatar: e.target.value })} disabled={uploaded} />
                <label className="text-xs px-3 py-2 border border-gray-300 rounded cursor-pointer whitespace-nowrap hover:bg-gray-50">
                  ⬆ Upload
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ''; }} />
                </label>
              </div>
              {uploaded && (
                <div className="text-[10px] text-gray-400">Uploaded image set · <button type="button" onClick={() => setF({ ...f, avatar: '' })} className="underline" style={{ color: '#5147e6' }}>remove</button></div>
              )}
            </div>
          </section>

          {f.entity_type && applicable.length > 0 && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Skills</h4>
              <p className="text-[11px] text-gray-400 mb-2">{isExpert ? 'What this specialist is allowed to do in their section.' : 'What this manager can plan and brief on.'}</p>
              <div className="flex flex-wrap gap-1.5">
                {applicable.map((c) => {
                  const on = !!skills[c.id];
                  return (
                    <button key={c.id} type="button" onClick={() => toggleSkill(c.id)}
                      className="text-xs px-2.5 py-1.5 rounded-full border text-left" title={c.description}
                      style={on ? { backgroundColor: '#5147e6', color: '#fff', borderColor: '#5147e6' } : { backgroundColor: '#fff', color: '#6b7280', borderColor: '#d1d5db' }}>
                      {on ? '✓ ' : ''}{c.name}{c.persists ? ' ✎' : ''}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">✎ = can change your data</p>
            </section>
          )}

          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">How much you trust them</h4>
            <div className="space-y-1.5">
              {TRUST.map((t) => (
                <label key={t.key} className="flex items-start gap-2 p-2 rounded border cursor-pointer"
                  style={f.autonomy === t.key ? { borderColor: '#5147e6', background: '#f8fafc' } : { borderColor: '#e5e7eb' }}>
                  <input type="radio" name="trust" checked={f.autonomy === t.key} onChange={() => setF({ ...f, autonomy: t.key })} className="mt-0.5" />
                  <span>
                    <span className="text-sm text-gray-800">{t.label}</span>
                    <span className="block text-[11px] text-gray-400">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Track record + promotion — trust earned, not just set */}
          {f.existing && (
            <section>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Track record</h4>
              {f.quality ? (
                <div className="text-sm text-gray-700">
                  {f.quality.approval != null ? <><strong>{Math.round(f.quality.approval * 100)}%</strong> approved</> : 'No ratings yet'}
                  <span className="text-gray-400"> · {f.quality.signals || 0} task{f.quality.signals === 1 ? '' : 's'} · {f.quality.corrections || 0} correction{f.quality.corrections === 1 ? '' : 's'}</span>
                </div>
              ) : (
                <div className="text-[11px] text-gray-400">No feedback yet — trust grows as you approve this worker’s output and shrinks when you correct it.</div>
              )}
              {f.promotion?.eligible && (
                <div className="mt-2 flex items-center justify-between gap-2 rounded p-2" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                  <span className="text-[11px]" style={{ color: '#065f46' }}>
                    Earned more trust — ready for <b>“{trustLabel(f.promotion.recommended)}”</b>{f.promotion.reasons?.[0] ? `. ${f.promotion.reasons[0]}` : ''}
                  </span>
                  <button onClick={promote} disabled={busy} className="ai-plan-btn text-[11px] disabled:opacity-50 whitespace-nowrap">{busy ? '…' : '↑ Promote'}</button>
                </div>
              )}
              {f.promotion && !f.promotion.eligible && !f.promotion.at_top && (
                <div className="mt-1.5 text-[11px] text-gray-400">Toward “{trustLabel(f.promotion.recommended)}”: {f.promotion.reasons?.[0]}</div>
              )}
              {f.promotion?.at_top && (
                <div className="mt-1.5 text-[11px] text-gray-400">Already at full autonomy.</div>
              )}
            </section>
          )}

          <section className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-800">On staff</div>
              <div className="text-[11px] text-gray-400">Turn off to bench this worker without removing them.</div>
            </div>
            <button onClick={() => setF({ ...f, enabled: !f.enabled })} className="text-xs px-3 py-1.5 rounded-full font-semibold"
              style={f.enabled ? { background: '#dcfce7', color: '#166534' } : { background: '#f1f5f9', color: '#64748b' }}>
              {f.enabled ? 'Employed' : 'Benched'}
            </button>
          </section>

          {err && <div className="text-[11px] p-2 rounded border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{err}</div>}

          <div className="flex items-center gap-2 pt-1">
            <button onClick={save} disabled={busy} className="ai-plan-btn text-sm disabled:opacity-50">
              {busy ? 'Saving…' : f.existing ? 'Save training' : 'Assign & train'}
            </button>
            {f.existing && <button onClick={remove} disabled={busy} className="text-sm text-red-600 underline disabled:opacity-50">Remove</button>}
            <div className="flex-1" />
            <button onClick={onClose} className="text-sm text-gray-500">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
