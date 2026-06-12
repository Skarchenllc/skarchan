'use client';

/**
 * AiAssist — in-context AI button for any section.
 *
 * Renders nothing unless AI is enabled for (module, entityType) and at least
 * one on-demand, non-persisting capability is on. So the button only appears
 * where an admin turned AI on in nexacore › AI Management. Exposes the enabled
 * capabilities (ask / summarize / extract) in a small popover.
 */

import React, { useEffect, useRef, useState } from 'react';

interface Cap {
  id: string; name: string; description: string; applies_to: string[];
  mode: string; persists: boolean; retrieval: boolean; is_action: boolean; is_update: boolean;
}
interface Props {
  module: string;
  entityType: string;
  // Friendly section name (e.g. "Transactions", "Projects") for section-aware copy.
  sectionLabel?: string;
  // Open a cited record in the section's View modal (provided by EntityList).
  onOpenRecord?: (id: string) => void;
  // When provided, the assistant operates on this single record (summarize /
  // extract this record) instead of the whole section.
  record?: any;
}

// --- Minimal markdown renderer (bold, tables, bullets, headings) -----------
function renderInline(text: string): React.ReactNode[] {
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>);
}

function Markdown({ text }: { text: string }) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;
  const isSep = (l: string) => /^[\s:|-]+$/.test(l) && l.includes('-') && l.includes('|');
  while (i < lines.length) {
    const line = lines[i];
    // Table: header row + separator row + data rows
    if (line.trim().startsWith('|') && i + 1 < lines.length && isSep(lines[i + 1])) {
      const tbl: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { tbl.push(lines[i]); i++; }
      const rows = tbl.map((l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
      const header = rows[0] || [];
      const body = rows.slice(2);
      // Render with <div>s (not <table>) so the global spreadsheet-table grid
      // styling doesn't apply — clean label:value rows.
      blocks.push(
        <div key={key++} style={{ fontSize: 13, margin: '4px 0' }}>
          {body.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 10, padding: '2px 0', alignItems: 'baseline' }}>
              {row.map((c, j) => (
                <div key={j} style={{
                  color: j === 0 ? '#6b7280' : '#0f172a',
                  fontSize: j === 0 ? 12 : 13,
                  flex: j === 0 ? '0 0 40%' : '1',
                }}>{renderInline(c)}</div>
              ))}
            </div>
          ))}
        </div>,
      );
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)/);
    if (h) { blocks.push(<div key={key++} style={{ fontWeight: 700, margin: '6px 0 2px' }}>{renderInline(h[2])}</div>); i++; continue; }
    if (/^\s*[-*•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*•]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*•]\s+/, '')); i++; }
      blocks.push(<ul key={key++} style={{ margin: '4px 0', paddingLeft: 18, listStyle: 'disc' }}>{items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}</ul>);
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    blocks.push(<p key={key++} style={{ margin: '3px 0' }}>{renderInline(line)}</p>);
    i++;
  }
  return <div>{blocks}</div>;
}

// Flatten a record's data into a readable "Label: value" block.
function recordToText(record: any): string {
  const data = record?.data ?? record ?? {};
  return Object.entries(data)
    .filter(([, v]) => v !== null && v !== '' && typeof v !== 'object')
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
}

export default function AiAssist({ module, entityType, sectionLabel, onOpenRecord, record }: Props) {
  const recordMode = !!record;
  // Universal verbs (Ask / Action / Train) adapt to the section via this noun.
  const noun = (sectionLabel || 'records').trim();
  const singular = noun.replace(/s$/i, '') || 'record';
  const [caps, setCaps] = useState<Cap[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [capId, setCapId] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [ranInput, setRanInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [improving, setImproving] = useState(false);
  const [correction, setCorrection] = useState('');
  const [copied, setCopied] = useState(false);
  const [followup, setFollowup] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Action (create record) state
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [updateTarget, setUpdateTarget] = useState<{ record_id: string | null; label: string | null } | null>(null);
  const [creating, setCreating] = useState(false);
  const [createdMsg, setCreatedMsg] = useState<string | null>(null);
  // Attached image (invoice/receipt photo) for vision-based Create.
  const [image, setImage] = useState<{ media_type: string; data: string; preview: string } | null>(null);

  // Match the app's API client: send the stored Bearer token so the backend knows who we are.
  const authHeaders = (json = true): Record<string, string> => {
    const h: Record<string, string> = {};
    if (json) h['Content-Type'] = 'application/json';
    try {
      const t = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (t) h['Authorization'] = `Bearer ${t}`;
    } catch { /* ignore */ }
    return h;
  };

  // Live camera capture (works on desktop webcams too, unlike <input capture>).
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [streamTick, setStreamTick] = useState(0);
  // Voice dictation (Web Speech API)
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const baseInputRef = useRef('');

  const setFromCanvas = (source: CanvasImageSource, sw: number, sh: number) => {
    const maxDim = 1568;
    const scale = Math.min(1, maxDim / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d')?.drawImage(source, 0, 0, w, h);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setImage({ media_type: 'image/jpeg', data: dataUrl.split(',')[1] || '', preview: dataUrl });
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };
  const closeCamera = () => { stopTracks(); setCameraOn(false); };

  const startStream = async (mode: 'environment' | 'user') => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera not available in this browser. Use File instead.');
      return;
    }
    stopTracks();
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } }, audio: false });
      } catch {
        // Desktop webcams often have no facingMode — fall back to any camera.
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setCameraOn(true);
      setStreamTick((t) => t + 1);  // retrigger attach (e.g. on flip)
    } catch {
      setError('Could not open the camera (permission denied or no device). Use File instead.');
      setCameraOn(false);
    }
  };
  const openCamera = () => { setFacing('environment'); startStream('environment'); };
  const flipCamera = () => { const next = facing === 'environment' ? 'user' : 'environment'; setFacing(next); startStream(next); };

  const capturePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setError('Camera still loading — wait a moment and try again.'); return; }
    setFromCanvas(v, v.videoWidth, v.videoHeight);
    closeCamera();
  };

  // Attach the live stream to the <video> once it's mounted (reliable vs setTimeout).
  useEffect(() => {
    const v = videoRef.current;
    if (cameraOn && v && streamRef.current) {
      v.srcObject = streamRef.current;
      v.play().catch(() => {});
    }
  }, [cameraOn, streamTick]);
  useEffect(() => () => stopTracks(), []);          // stop camera on unmount

  // Voice dictation — append speech to the text box.
  useEffect(() => {
    setMicSupported(typeof window !== 'undefined' && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
  }, []);
  const stopMic = () => { try { recognitionRef.current?.stop(); } catch { /* ignore */ } };
  const toggleMic = () => {
    if (listening) { stopMic(); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.continuous = false;
    baseInputRef.current = input ? input.replace(/\s*$/, '') + ' ' : '';
    rec.onresult = (e: any) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput(baseInputRef.current + txt);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  useEffect(() => { if (!open) { closeCamera(); stopMic(); } }, [open]);  // stop when popover closes

  // Downscale + re-encode so uploads stay small and within the model's image limits.
  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1568;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImage({ media_type: 'image/jpeg', data: dataUrl.split(',')[1] || '', preview: dataUrl });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [capsR, setR, st] = await Promise.all([
          fetch(`/api/v1/ai/capabilities?entity_type=${encodeURIComponent(entityType)}`, { headers: authHeaders(false) }).then((r) => r.json()),
          fetch(`/api/v1/ai/settings?module_code=${encodeURIComponent(module)}`, { headers: authHeaders(false) }).then((r) => r.json()),
          fetch('/api/v1/ai/status', { headers: authHeaders(false) }).then((r) => r.json()),
        ]);
        // Write actions (Create/Update) require permission per the access policy.
        const canWrite = (st?.access?.writes_require !== 'admin') || !!st?.me?.is_admin;
        const rows = setR.data || [];
        // Match the section by name variants (e.g. sales_accounts ↔ accounts) so the
        // AI shows ONLY when this specific section is toggled on — no module-wide spill.
        const variants = [entityType];
        const suffix = `_${module}`;
        if (entityType.endsWith(suffix)) variants.push(entityType.slice(0, -suffix.length));
        const prefix = `${module}_`;
        if (entityType.startsWith(prefix)) variants.push(entityType.slice(prefix.length));
        const setting = rows.find((s: any) => variants.includes(s.entity_type) && s.enabled);
        if (!setting) { if (!cancelled) setReady(true); return; }
        const capCfg = setting.capabilities || {};
        const enabled = (capsR.data || []).filter((c: Cap) => {
          if (c.mode !== 'on_demand') return false;
          // Write actions are hidden from users without write permission.
          if (c.is_action && !canWrite) return false;
          // Allow action capabilities (which write a record via draft→create) but
          // exclude other persisting capabilities (e.g. auto-plan has its own UI).
          if (c.persists && !c.is_action) return false;
          // Record mode operates on a single record: no section-wide retrieval or
          // create — but Update is allowed (it edits THIS record directly).
          if (recordMode && c.id !== 'update_record' && (c.retrieval || c.is_action)) return false;
          // On a list, keep the three high-value skills (Ask / Create / Classify).
          // Paste-based skills (Summarize / Extract) only appear on a record view,
          // where they operate on that record.
          if (!recordMode && (c.id === 'summarize' || c.id === 'extract')) return false;
          const e = capCfg[c.id]?.enabled;
          return e === undefined ? true : e;
        });
        if (!cancelled) {
          // In list context, default to grounded "Ask Your Data" (answers over the
          // section's real records) rather than Summarize, which only condenses
          // pasted text. In record context, keep summarize/extract on the record.
          const ordered = recordMode
            ? enabled
            : [...enabled].sort((a, b) => (a.id === 'ask' ? -1 : 0) - (b.id === 'ask' ? -1 : 0));
          setCaps(ordered);
          if (ordered[0]) setCapId(ordered[0].id);
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, [module, entityType]);

  if (!ready || caps.length === 0) return null;

  const activeCap = caps.find((c) => c.id === capId);
  const isAction = !!activeCap?.is_action;
  const isUpdate = !!activeCap?.is_update;
  const isAsk = capId === 'ask';
  const recordText = recordMode ? recordToText(record) : '';
  const placeholder = isUpdate
    ? 'Describe the change — e.g. "mark TXN-10004 as paid" or "set its status to done"'
    : isAction
      ? `Describe the ${singular} to create — e.g. "Paid $500 cash to ABC Supplies for office furniture on 5 June, expense"`
      : isAsk
        ? `Ask about your ${noun} — e.g. "which are overdue or high-value?"`
        : capId === 'classify'
          ? 'Type an item to tag — and correct it to teach the AI…'
          : recordMode
            ? 'Leave blank to use this record, or paste other text…'
            : 'Paste text to process…';

  // Section-aware one-liner under the tabs.
  const capHelp = isUpdate
    ? `Change an existing ${singular} — describe what to update.`
    : isAsk
      ? `Ask for any information about your ${noun}.`
      : isAction
        ? `Create a new ${singular} from a description or image.`
        : capId === 'classify'
          ? 'Train the AI your categories so it improves over time.'
          : (activeCap?.description || '');

  const draftAction = async () => {
    const text = input.trim();
    if (!text && !image) return;
    setLoading(true); setError(null); setResult(null); setDraft(null); setUpdateTarget(null); setCreatedMsg(null);
    try {
      const context: any = { input: text };
      if (image) context.image = { media_type: image.media_type, data: image.data };
      // Record-detail Update: act on THIS record directly (no search).
      if (isUpdate && recordMode && record) {
        context.current_record = recordText;
        context.record_id = record.id;
        context.record_label = record.data?.name || record.data?.title || record.data?.transaction_number || record.data?.reference || 'this record';
      }
      const r = await fetch('/api/v1/ai/preview', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ capability: capId, module_code: module, entity_type: entityType, context }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.detail || `Failed (${r.status})`);
      if (isUpdate) {
        const res = body.result || {};
        setUpdateTarget({ record_id: res.record_id ?? null, label: res.label ?? null });
        setDraft(res.changes || {});
      } else {
        setUpdateTarget(null);
        setDraft(body.result || {});
      }
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const createFromDraft = async () => {
    if (!draft) return;
    if (isUpdate && !updateTarget?.record_id) { setError('No matching record found — name it (e.g. its number).'); return; }
    setCreating(true); setError(null);
    try {
      const applyResult = isUpdate ? { record_id: updateTarget?.record_id, changes: draft } : draft;
      const r = await fetch('/api/v1/ai/apply', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ capability: capId, module_code: module, entity_type: entityType, result: applyResult }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.detail || `Failed (${r.status})`);
      setCreatedMsg('Created — refreshing the list…');
      setTimeout(() => window.location.reload(), 1200);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const run = async () => {
    if (isAction) return draftAction();
    const text = input.trim() || (recordMode ? recordText : '');
    if (!text) return;
    setLoading(true); setError(null); setResult(null); setFeedbackMsg(null); setImproving(false); setCorrection('');
    try {
      const context = isAsk ? { question: text } : { input: text };
      const r = await fetch('/api/v1/ai/run', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ capability: capId, module_code: module, entity_type: entityType, context }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.detail || `Failed (${r.status})`);
      setResult(body);
      setRanInput(text);
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  // Feedback teaches the section over time: 👍 / 👎 / a corrected version all
  // become golden examples injected into future runs for this capability.
  const sendFeedback = async (rating?: 'up' | 'down', corrected?: string) => {
    try {
      await fetch('/api/v1/ai/feedback', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          capability_id: capId, module_code: module, entity_type: entityType,
          run_id: result?.run_id, rating, input: ranInput,
          output: result?.result?.text || '', corrected: corrected || null,
        }),
      });
      setFeedbackMsg(corrected ? 'Saved — the assistant will learn from your version.' : 'Thanks — feedback recorded.');
      setImproving(false);
    } catch {
      setFeedbackMsg('Could not save feedback.');
    }
  };

  const copyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(result?.result?.text || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  const askFollowup = async () => {
    const q = followup.trim();
    if (!q) return;
    const history = `Earlier question: "${ranInput}"\nEarlier answer: ${result?.result?.text || ''}\n\n`
      + `Now answer this follow-up using the records: ${q}`;
    setLoading(true); setError(null); setFeedbackMsg(null);
    try {
      const r = await fetch('/api/v1/ai/run', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ capability: 'ask', module_code: module, entity_type: entityType, context: { question: history } }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.detail || `Failed (${r.status})`);
      setResult(body); setRanInput(q); setFollowup('');
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" className="ai-plan-btn text-sm" onClick={() => setOpen((o) => !o)} title="AI assistant for this section">
        <span className="inline-flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
            {/* Aladdin-style genie lamp */}
            <ellipse cx="11" cy="15" rx="7" ry="3.5" />
            <path d="M5 13.6C2.6 12.7 1.6 11.2 2.1 10.1l1.1.5c-.1.9.9 2.1 2.9 2.6z" />
            <path d="M17 13.7c3.9-1 3.9 3.7 0 2.7v-1.2c1.9.4 1.9-.7 0-.3z" />
            <path d="M8 12.2c.6-2.4 6.4-2.4 7 0z" />
            <circle cx="11.5" cy="9.1" r="1.05" />
            <path d="M11.5 10.1v1.2" stroke="#ffffff" strokeWidth="0.9" />
            <ellipse cx="11" cy="18.4" rx="3.4" ry="0.9" />
          </svg>
          AI
        </span>
      </button>
      {open && (
        <div
          className="rounded-lg p-3"
          style={{
            position: 'absolute', right: 0, top: '115%', zIndex: 50, width: 360,
            border: '2px solid #5147e6', backgroundColor: '#eff5ff',
            boxShadow: '0 10px 25px rgba(60,59,110,0.18)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex gap-1 flex-wrap">
              {caps.map((c) => {
                const active = capId === c.id;
                return (
                  <span
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => { setCapId(c.id); setResult(null); setError(null); setDraft(null); setUpdateTarget(null); setCreatedMsg(null); setImage(null); closeCamera(); }}
                    className="text-xs px-3 py-1 rounded-full cursor-pointer select-none"
                    style={active
                      ? { backgroundColor: '#5147e6', color: '#fff', fontWeight: 600 }
                      : { backgroundColor: '#fff', color: '#334155', border: '1px solid #cbd5e1' }}
                  >
                    {c.name}
                  </span>
                );
              })}
            </div>
            <button type="button" onClick={() => setOpen(false)} className="text-xs text-gray-400" aria-label="Close">✕</button>
          </div>
          {capHelp && <p className="text-xs text-gray-500 mb-2">{capHelp}</p>}
          <textarea
            value={input} onChange={(e) => setInput(e.target.value)} rows={3} placeholder={placeholder}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
          />

          {/* Attach an invoice / receipt photo for the AI to read (Create only) */}
          {isAction && !isUpdate && (
            <div className="mt-2">
              {cameraOn ? (
                <div>
                  <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', borderRadius: 4, background: '#000', maxHeight: 220 }} />
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <button type="button" className="text-xs px-2 py-1 border border-gray-300 rounded" onClick={flipCamera} title="Switch front/back camera">🔄 Flip</button>
                    <div className="flex gap-2">
                      <button type="button" className="text-xs px-2 py-1" onClick={closeCamera}>Cancel</button>
                      <button type="button" className="ai-plan-btn text-xs" onClick={capturePhoto}>📷 Capture</button>
                    </div>
                  </div>
                </div>
              ) : !image ? (
                <div className="flex items-center gap-2">
                  <label className="text-xs inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded cursor-pointer text-gray-600" title="Upload an image file">
                    <span aria-hidden="true">📁</span> File
                    <input
                      type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.currentTarget.value = ''; }}
                    />
                  </label>
                  <button type="button" className="text-xs inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-gray-600" title="Open camera" onClick={openCamera}>
                    <span aria-hidden="true">📷</span> Camera
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <img src={image.preview} alt="attachment" style={{ height: 44, width: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                  <span className="text-xs text-gray-500">Image attached</span>
                  <button type="button" className="text-xs text-red-600 underline" onClick={() => setImage(null)}>remove</button>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end items-center gap-2 mt-2">
            {micSupported && (
              <span
                role="button"
                tabIndex={0}
                onClick={toggleMic}
                title={listening ? 'Stop dictation' : 'Speak your instruction'}
                className="cursor-pointer select-none inline-flex items-center justify-center rounded-full"
                style={{
                  width: 30, height: 30,
                  backgroundColor: listening ? '#dc2626' : '#fff',
                  border: `1px solid ${listening ? '#dc2626' : '#cbd5e1'}`,
                  color: listening ? '#fff' : '#334155',
                  animation: listening ? 'pulse 1.2s infinite' : 'none',
                }}
              >
                🎤
              </span>
            )}
            <button type="button" className="ai-plan-btn text-sm disabled:opacity-60" disabled={loading} onClick={run}>
              {loading
                ? (isAction ? (isUpdate ? 'Finding…' : 'Creating…') : 'Running…')
                : (isAction ? (isUpdate ? 'Update' : 'Create') : 'Run')}
            </button>
          </div>
          {error && <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

          {/* Action: review & edit the drafted record, then create it */}
          {isAction && draft && (
            <div className="mt-2 border border-gray-200 rounded p-2 bg-gray-50">
              <div className="text-xs text-gray-400 mb-1">
                {isUpdate
                  ? (updateTarget?.record_id
                      ? `Updating ${updateTarget.label || 'record'} — review the changes, then save.`
                      : 'No matching record found — try naming it (e.g. its number).')
                  : 'Draft — review/edit, then create. Nothing saved yet.'}
              </div>
              <div className="max-h-56 overflow-auto">
                {Object.keys(draft).length === 0 && <div className="text-xs text-gray-500">No fields could be filled from that description.</div>}
                {Object.entries(draft).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] text-gray-500 truncate" style={{ width: 96 }} title={k}>{k}</span>
                    <input
                      className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                      value={v == null ? '' : String(v)}
                      onChange={(e) => setDraft({ ...draft, [k]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              {createdMsg ? (
                <div className="text-xs text-green-700 mt-1">{createdMsg}</div>
              ) : (
                <div className="flex justify-end gap-2 mt-2">
                  <button type="button" className="text-xs px-2 py-1" onClick={() => { setDraft(null); setUpdateTarget(null); }}>Discard</button>
                  <button type="button" className="ai-plan-btn text-xs disabled:opacity-60" disabled={creating || Object.keys(draft).length === 0 || (isUpdate && !updateTarget?.record_id)} onClick={createFromDraft}>
                    {creating ? 'Saving…' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          )}
          {result && (
            <>
              <div className="mt-2 text-sm bg-white border border-gray-200 rounded p-2 max-h-72 overflow-auto">
                {result.result?.text != null
                  ? <Markdown text={String(result.result.text)} />
                  : <span className="whitespace-pre-wrap">{JSON.stringify(result.result)}</span>}
                {(() => {
                  // Only show sources the answer actually cites (e.g. [1][3]) — and
                  // make each one a clickable link to the record.
                  const txt = String(result.result?.text || '');
                  const cited = new Set((txt.match(/\[(\d+)\]/g) || []).map((s) => parseInt(s.replace(/\D/g, ''), 10)));
                  const shown = (result.citations || []).filter((c: any) => cited.has(c.ref));
                  return shown.length > 0 ? (
                    <div className="text-xs text-gray-400 mt-2">
                      Sources:{' '}
                      {shown.map((c: any, idx: number) => (
                        <React.Fragment key={c.ref}>
                          {idx > 0 ? '  ·  ' : ''}
                          <span role="button" tabIndex={0} onClick={() => onOpenRecord?.(c.id)}
                            className="cursor-pointer" style={{ color: '#5147e6', textDecoration: 'underline' }}
                            title={`Open ${c.label}`}>[{c.ref}] {c.label}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  ) : null;
                })()}
              </div>
              {result.result?.text && (
                <div className="flex items-center justify-end mt-1">
                  <button type="button" onClick={copyAnswer} className="text-xs text-gray-500 underline">{copied ? 'Copied' : 'Copy'}</button>
                </div>
              )}
              {isAsk && (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    value={followup} onChange={(e) => setFollowup(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') askFollowup(); }}
                    placeholder="Ask a follow-up…"
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  />
                  <button type="button" className="ai-plan-btn text-xs disabled:opacity-60" disabled={loading || !followup.trim()} onClick={askFollowup}>Ask</button>
                </div>
              )}
              {result.worker && (
                <div className="text-[11px] text-gray-400 mt-1">by {result.worker}</div>
              )}
              {/* Feedback — this is how the section learns over time */}
              {feedbackMsg ? (
                <div className="text-xs text-green-700 mt-1">{feedbackMsg}</div>
              ) : (
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <button type="button" onClick={() => sendFeedback('up')} className="text-gray-500" title="Good answer">👍</button>
                  <button type="button" onClick={() => sendFeedback('down')} className="text-gray-500" title="Bad answer">👎</button>
                  <button type="button" onClick={() => { setImproving((v) => !v); setCorrection(result.result?.text || ''); }} className="text-gray-500 underline">
                    Improve
                  </button>
                </div>
              )}
              {improving && !feedbackMsg && (
                <div className="mt-1">
                  <textarea value={correction} onChange={(e) => setCorrection(e.target.value)} rows={3}
                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                    placeholder="Edit to the answer you'd have wanted…" />
                  <div className="flex justify-end mt-1">
                    <button type="button" className="ai-plan-btn text-xs" onClick={() => sendFeedback('up', correction.trim())}>
                      Teach this
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </span>
  );
}
