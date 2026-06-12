'use client';

import { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { Cap, Mod, Setting, AUTONOMY, TIERS, keyOf, authHeaders, getJSON, Toggle } from '@/components/ai/kit';

// Capabilities grouped by what they do, so the read-vs-write distinction is clear.
const CAP_GROUP: Record<string, string> = {
  summarize: 'Assist', extract: 'Assist', ask: 'Assist',
  create_record: 'Act', update_record: 'Act', propose_changes: 'Act',
  risk_scan: 'Watch', classify: 'Learn',
};
const GROUP_ORDER = ['Assist', 'Act', 'Watch', 'Learn', 'Other'];
const GROUP_HINT: Record<string, string> = {
  Assist: 'read-only — drafts you trigger',
  Act: 'writes data — gated by autonomy + policy',
  Watch: 'runs in the background',
  Learn: 'teaches the AI your categories',
};

// Sections — turn AI on/off per module & section, pick which capabilities run,
// set autonomy and model tier, and run a module manager briefing.
export default function SectionsPage() {
  const [status, setStatus] = useState<any>(null);
  const [caps, setCaps] = useState<Cap[]>([]);
  const [workers, setWorkers] = useState<any[]>([]);
  const [modules, setModules] = useState<Mod[]>([]);
  const [settings, setSettings] = useState<Record<string, Setting>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState('');
  const [managerRun, setManagerRun] = useState<Record<string, any>>({});
  const [delegateText, setDelegateText] = useState<Record<string, string>>({});
  const [delegateRun, setDelegateRun] = useState<Record<string, any>>({});
  const [indexing, setIndexing] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [st, cp, sg, md, wk] = await Promise.all([
        getJSON('/api/v1/ai/status'),
        getJSON('/api/v1/ai/capabilities'),
        getJSON('/api/v1/ai/settings'),
        getJSON('/api/v1/development/modules-with-entity-types'),
        getJSON('/api/v1/ai/workers'),
      ]);
      setStatus(st);
      setCaps(cp?.data || []);
      setWorkers(wk?.data || []);
      setModules(Array.isArray(md) ? md : md?.data || []);
      const map: Record<string, Setting> = {};
      for (const s of (sg?.data || [])) map[keyOf(s.module_code, s.entity_type)] = s;
      setSettings(map);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const reloadSettings = async () => {
    const sg = await getJSON('/api/v1/ai/settings');
    const map: Record<string, Setting> = {};
    for (const s of (sg?.data || [])) map[keyOf(s.module_code, s.entity_type)] = s;
    setSettings(map);
  };

  const capsFor = (entity: string) =>
    caps.filter((c) => (c as any).mode !== 'manager' && (c.applies_to.includes('*') || c.applies_to.includes(entity)));

  const workerByKey = useMemo(() => {
    const m: Record<string, any> = {};
    for (const w of workers) if (w.enabled !== false) m[keyOf(w.module_code, w.entity_type)] = w;
    return m;
  }, [workers]);
  // Group a section's capabilities into Assist / Act / Watch / Learn.
  const groupCaps = (list: Cap[]) => {
    const by: Record<string, Cap[]> = {};
    for (const c of list) (by[CAP_GROUP[c.id] || 'Other'] ||= []).push(c);
    return GROUP_ORDER.filter((g) => by[g]?.length).map((g) => ({ group: g, items: by[g] }));
  };

  const saveSetting = async (module_code: string, entity_type: string, next: Partial<Setting>) => {
    const key = keyOf(module_code, entity_type);
    const cur = settings[key] || { module_code, entity_type, enabled: false, capabilities: {} };
    const body = {
      module_code, entity_type,
      enabled: next.enabled ?? cur.enabled ?? false,
      model_tier: next.model_tier ?? cur.model_tier ?? null,
      capabilities: next.capabilities ?? cur.capabilities ?? {},
    };
    setSettings((prev) => ({ ...prev, [key]: { ...(cur as Setting), ...body } }));   // optimistic
    setSaveError(null);
    try {
      const r = await fetch('/api/v1/ai/settings', { method: 'PUT', headers: authHeaders(), body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.status === 401 || r.status === 403 ? 'Not allowed — sign in as an admin to change AI settings.' : `Save failed (${r.status}).`);
      const saved = await r.json();
      setSettings((prev) => ({ ...prev, [key]: saved }));
    } catch (e: any) {
      setSettings((prev) => ({ ...prev, [key]: cur }));   // revert
      setSaveError(e?.message || 'Save failed.');
    }
  };
  const bulkSetModule = async (m: Mod, enabled: boolean) => {
    await fetch('/api/v1/ai/settings/bulk', {
      method: 'POST', headers: authHeaders(),
      body: JSON.stringify({ module_code: m.module_code, entity_types: m.components.map((c) => c.component_code), enabled }),
    });
    await reloadSettings();
  };
  const toggleSection = (m: string, e: string) => saveSetting(m, e, { enabled: !(settings[keyOf(m, e)]?.enabled) });
  const toggleCap = (m: string, e: string, capId: string, sectionEnabled: boolean) => {
    const cur = settings[keyOf(m, e)] || ({} as Setting);
    const cc = { ...(cur.capabilities || {}) };
    const explicit = cc[capId]?.enabled;
    const effective = explicit === undefined ? sectionEnabled : explicit;
    cc[capId] = { ...(cc[capId] || {}), enabled: !effective };
    saveSetting(m, e, { capabilities: cc });
  };
  const setCapAutonomy = (m: string, e: string, capId: string, autonomy: string) => {
    const cur = settings[keyOf(m, e)] || ({} as Setting);
    const cc = { ...(cur.capabilities || {}) };
    cc[capId] = { ...(cc[capId] || {}), autonomy };
    saveSetting(m, e, { capabilities: cc });
  };
  const runDelegate = async (moduleCode: string) => {
    const instruction = (delegateText[moduleCode] || '').trim();
    if (!instruction) return;
    setDelegateRun((p) => ({ ...p, [moduleCode]: { busy: true } }));
    try {
      const r = await fetch('/api/v1/ai/delegate', {
        method: 'POST', headers: authHeaders(), body: JSON.stringify({ module_code: moduleCode, instruction }),
      }).then((x) => x.json());
      setDelegateRun((p) => ({ ...p, [moduleCode]: { summary: r.summary, steps: r.steps, error: r.error, cost: r.cost_usd, manager: r.manager } }));
    } catch { setDelegateRun((p) => ({ ...p, [moduleCode]: { error: 'Delegation failed' } })); }
  };
  const runManager = async (moduleCode: string) => {
    setManagerRun((p) => ({ ...p, [moduleCode]: { busy: true } }));
    try {
      const r = await fetch(`/api/v1/ai/manage?module_code=${encodeURIComponent(moduleCode)}`, { method: 'POST', headers: authHeaders() }).then((x) => x.json());
      setManagerRun((p) => ({ ...p, [moduleCode]: { brief: r.brief, error: r.error, specialists: r.specialists, reviewed: r.sections_reviewed } }));
    } catch { setManagerRun((p) => ({ ...p, [moduleCode]: { error: 'Manager run failed' } })); }
  };
  const indexSection = async (m: string, e: string) => {
    setIndexing((p) => ({ ...p, [keyOf(m, e)]: '…' }));
    try {
      const r = await fetch(`/api/v1/ai/index?module_code=${encodeURIComponent(m)}&entity_type=${encodeURIComponent(e)}`, { method: 'POST', headers: authHeaders() }).then((x) => x.json());
      setIndexing((p) => ({ ...p, [keyOf(m, e)]: r.reason ? r.reason : `indexed ${r.indexed}` }));
    } catch { setIndexing((p) => ({ ...p, [keyOf(m, e)]: 'failed' })); }
  };

  const filteredModules = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter((m) =>
      m.module_label.toLowerCase().includes(q) || m.components.some((c) => c.component_label.toLowerCase().includes(q)));
  }, [modules, query]);
  const enabledCount = (m: Mod) => m.components.filter((c) => settings[keyOf(m.module_code, c.component_code)]?.enabled).length;

  if (loading) return <div className="text-sm text-gray-500 py-12 text-center">Loading…</div>;

  return (
    <>
      {saveError && (
        <div className="mb-3 px-3 py-2 text-sm rounded border" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>{saveError}</div>
      )}
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search modules or sections…"
        className="px-3 py-2 text-sm border border-gray-300 rounded mb-3 w-72" />
      <div className="space-y-2">
        {filteredModules.map((m) => {
          const open = expanded[m.module_code];
          const on = enabledCount(m);
          return (
            <div key={m.module_code} className="bg-white border border-gray-200 rounded-lg">
              <button onClick={() => setExpanded((p) => ({ ...p, [m.module_code]: !open }))} className="w-full flex items-center justify-between px-4 py-3">
                <span className="flex items-center gap-2">
                  {open ? <FiChevronDown /> : <FiChevronRight />}
                  <span className="font-semibold" style={{ color: '#111827' }}>{m.module_label}</span>
                  <span className="text-xs text-gray-400">{m.components.length} sections</span>
                </span>
                {on > 0 && <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>AI on · {on}</span>}
              </button>
              {open && (
                <div className="border-t border-gray-100">
                  <div className="px-4 py-2 flex items-center justify-between bg-gray-50 gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button className="text-xs px-2 py-1 border border-gray-300 rounded" onClick={() => bulkSetModule(m, true)} title="Turn AI on for every section in this module">
                        Enable AI for all {m.components.length} sections
                      </button>
                      {on > 0 && (
                        <button className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-500" onClick={() => bulkSetModule(m, false)} title="Turn AI off for every section">Disable all</button>
                      )}
                    </div>
                    <button className="ai-plan-btn text-xs" disabled={managerRun[m.module_code]?.busy} onClick={() => runManager(m.module_code)}>
                      {managerRun[m.module_code]?.busy ? 'Briefing…' : '🧭 Run manager briefing'}
                    </button>
                  </div>
                  {managerRun[m.module_code]?.error && (<div className="px-4 py-2 text-xs" style={{ color: '#92400e' }}>{managerRun[m.module_code].error}</div>)}
                  {managerRun[m.module_code]?.brief && (
                    <div className="px-4 py-3 text-sm border-b border-gray-100" style={{ backgroundColor: '#f8fafc' }}>
                      {(managerRun[m.module_code].specialists?.length || managerRun[m.module_code].reviewed?.length) ? (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span className="text-[11px] text-gray-400">Consulted:</span>
                          {(managerRun[m.module_code].specialists || []).map((sp: any, i: number) => (
                            <span key={`sp-${i}`} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>
                              🧑 {sp.name} · {sp.section}
                            </span>
                          ))}
                          {(managerRun[m.module_code].reviewed || [])
                            .filter((sec: string) => !(managerRun[m.module_code].specialists || []).some((sp: any) => sp.section === sec))
                            .map((sec: string, i: number) => (
                              <span key={`rv-${i}`} className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>{sec}</span>
                            ))}
                        </div>
                      ) : null}
                      <div className="text-gray-800">{managerRun[m.module_code].brief.summary}</div>
                      {(managerRun[m.module_code].brief.priorities || []).length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-gray-500">Priorities</div>
                          <ul className="list-disc ml-5 text-sm text-gray-700">
                            {managerRun[m.module_code].brief.priorities.slice(0, 4).map((p: string, i: number) => <li key={i}>{p}</li>)}
                          </ul>
                        </div>
                      )}
                      {(managerRun[m.module_code].brief.delegations || []).length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs font-semibold text-gray-500">Delegations</div>
                          <ul className="text-sm text-gray-700">
                            {managerRun[m.module_code].brief.delegations.slice(0, 4).map((d: any, i: number) => (
                              <li key={i}><span className="text-gray-400">{d.section} →</span> {d.action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Instruct the manager — it delegates to the section experts */}
                  <div className="px-4 py-2 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        value={delegateText[m.module_code] || ''}
                        onChange={(e) => setDelegateText((p) => ({ ...p, [m.module_code]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') runDelegate(m.module_code); }}
                        placeholder={`Instruct ${workerByKey[keyOf(m.module_code, '__manager__')]?.name || `the ${m.module_label} manager`}… e.g. “flag at-risk items and draft a follow-up”`}
                        className="flex-1 text-sm px-2 py-1.5 border border-gray-300 rounded" />
                      <button className="ai-plan-btn text-xs" disabled={delegateRun[m.module_code]?.busy}
                        onClick={() => runDelegate(m.module_code)}>
                        {delegateRun[m.module_code]?.busy ? 'Working…' : '🧑‍💼 Delegate'}
                      </button>
                    </div>
                    {delegateRun[m.module_code] && !delegateRun[m.module_code].busy && (
                      <div className="mt-2 text-sm">
                        {delegateRun[m.module_code].error ? (
                          <div className="text-xs" style={{ color: '#92400e' }}>{delegateRun[m.module_code].error}</div>
                        ) : (
                          <>
                            {delegateRun[m.module_code].manager && (
                              <div className="text-[11px] mb-0.5" style={{ color: '#92400e' }}>🧑‍💼 {delegateRun[m.module_code].manager} (unit manager) planned this:</div>
                            )}
                            {delegateRun[m.module_code].summary && <div className="text-gray-800">{delegateRun[m.module_code].summary}</div>}
                            <div className="mt-1.5 space-y-1">
                              {(delegateRun[m.module_code].steps || []).map((st: any, i: number) => {
                                const tone = st.status === 'applied' ? '#01411C'
                                  : st.status === 'pending review' ? '#d97706'
                                  : st.status === 'blocked' || st.status === 'failed' || st.status === 'skipped' ? '#dc2626' : '#64748b';
                                return (
                                  <div key={i} className="text-xs">
                                    <span className="font-medium text-gray-700">{st.expert || 'staff'}</span>
                                    <span className="text-gray-400"> · {st.capability} on {st.section} → </span>
                                    <span style={{ color: tone, fontWeight: 600 }}>{st.status}</span>
                                    {st.reason && <span className="text-gray-400"> — {st.reason}</span>}
                                    {st.result && <div className="text-gray-500 ml-3 mt-0.5">{st.result.slice(0, 300)}</div>}
                                  </div>
                                );
                              })}
                            </div>
                            {(delegateRun[m.module_code].steps || []).some((st: any) => st.status === 'pending review') && (
                              <div className="text-[11px] mt-1.5">
                                <a className="underline" href="/nexacore/automation/ai-jobs" style={{ color: '#5147e6' }}>Review pending writes in AI Jobs →</a>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="divide-y divide-gray-100">
                    {m.components.map((c) => {
                      const s = settings[keyOf(m.module_code, c.component_code)];
                      const enabled = !!s?.enabled;
                      const applicable = capsFor(c.component_code);
                      const w = workerByKey[keyOf(m.module_code, c.component_code)];
                      return (
                        <div key={c.component_code} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 flex items-center gap-2 flex-wrap">
                                {c.component_label}
                                {w && (
                                  <a href="/nexacore/ai/workers" title="This section has a hired AI worker — it sets the persona and the baseline autonomy for every capability here."
                                     className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>
                                    🧑 {w.name} · {w.autonomy}
                                  </a>
                                )}
                              </div>
                              <div className="text-xs text-gray-400">{c.component_code}</div>
                            </div>
                            <Toggle on={enabled} onClick={() => toggleSection(m.module_code, c.component_code)} />
                          </div>
                          {enabled && (
                            <div className="mt-3 pl-1 space-y-3">
                              {applicable.length === 0 && (<div className="text-xs text-gray-400">No capabilities apply to this section yet.</div>)}
                              {groupCaps(applicable).map(({ group, items }) => (
                                <div key={group} className="space-y-1.5">
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                                    {group} <span className="font-normal normal-case text-gray-300">· {GROUP_HINT[group]}</span>
                                  </div>
                                  {items.map((cap) => {
                                    const cc = s?.capabilities?.[cap.id];
                                    const capOn = cc?.enabled === undefined ? true : cc.enabled;
                                    // Effective autonomy shown: section override → worker → capability default.
                                    const autonomy = cc?.autonomy || w?.autonomy || cap.autonomy_default;
                                    const inherited = !cc?.autonomy;
                                    return (
                                      <div key={cap.id} className="flex items-center justify-between gap-3 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                          <input type="checkbox" checked={capOn} onChange={() => toggleCap(m.module_code, c.component_code, cap.id, enabled)} />
                                          <span style={{ color: capOn ? '#111827' : '#9ca3af' }}>{cap.name}</span>
                                          {cap.persists && (<span className="text-[10px] uppercase tracking-wide px-1 rounded" style={{ backgroundColor: '#eef2ff', color: '#3730a3' }}>writes data</span>)}
                                        </label>
                                        {capOn && (
                                          <select value={autonomy} onChange={(e) => setCapAutonomy(m.module_code, c.component_code, cap.id, e.target.value)}
                                            className="text-xs px-2 py-1 border border-gray-300 rounded"
                                            title={inherited ? `Inherited from ${w?.autonomy ? `worker (${w.name})` : 'capability default'} — change to override` : 'Section override'}
                                            style={inherited ? { color: '#9ca3af' } : undefined}>
                                            {AUTONOMY.map((a) => <option key={a} value={a}>{a}{inherited && a === autonomy ? ' (inherited)' : ''}</option>)}
                                          </select>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                              <div className="flex items-center gap-2 pt-1 text-xs text-gray-500">
                                <span>Model tier:</span>
                                <select value={s?.model_tier || ''} onChange={(e) => saveSetting(m.module_code, c.component_code, { model_tier: e.target.value || null })} className="px-2 py-1 border border-gray-300 rounded">
                                  <option value="">capability default</option>
                                  {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                                {status?.semantic?.available && (
                                  <>
                                    <button type="button" onClick={() => indexSection(m.module_code, c.component_code)} className="px-2 py-1 border border-gray-300 rounded" title="Embed this section's records into ChromaDB for semantic Ask Your Data">⟳ Index for search</button>
                                    {indexing[keyOf(m.module_code, c.component_code)] && (<span className="text-gray-400">{indexing[keyOf(m.module_code, c.component_code)]}</span>)}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
