'use client';

/**
 * Shared primitives for the AI & Automation control plane — the bits every
 * /nexacore/ai/* page needs: types, auth helper, fetch helpers, Toggle, StatCard.
 */
import React from 'react';

export interface Cap {
  id: string; name: string; description: string; applies_to: string[];
  mode: string; model_tier: string; autonomy_default: string;
  structured: boolean; persists: boolean;
}
export interface Section { component_code: string; component_label: string; is_active: boolean }
export interface Mod { module_code: string; module_label: string; color?: string; components: Section[] }
export interface Setting {
  module_code: string; entity_type: string; enabled: boolean;
  model_tier?: string | null; capabilities?: Record<string, any>;
}

export const AUTONOMY = ['suggest', 'review', 'auto'];
export const TIERS = ['reasoning', 'balanced', 'fast'];
export const keyOf = (m: string, e: string) => `${m}|${e}`;

// This app authenticates with a Bearer token in localStorage (the axios client
// injects it). Raw fetch() here must send it too, or admin-gated write endpoints
// return 401 and changes silently revert.
export const authHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const t = localStorage.getItem('access_token');
    if (t) h['Authorization'] = `Bearer ${t}`;
  }
  return h;
};

export const getJSON = (url: string) =>
  fetch(url, { headers: authHeaders() }).then((r) => r.json()).catch(() => null);

export function StatCard({ icon, label, value, sub }:
  { icon?: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-gray-500">{icon}{label}</div>
      <div className="text-base font-semibold text-gray-900 mt-1 truncate" title={value}>{value}</div>
      {sub ? <div className="text-xs text-gray-400 truncate">{sub}</div> : null}
    </div>
  );
}

// Avatar — gives each worker a distinct face. Uses a custom image URL if set,
// otherwise a deterministic illustrated avatar generated from the name (same name
// → same face). Falls back to a role emoji if the image can't load (offline/CSP).
export function Avatar({ name, src, kind, size = 22 }:
  { name?: string; src?: string; kind?: 'ceo' | 'manager' | 'expert'; size?: number }) {
  const [failed, setFailed] = React.useState(false);
  const emoji = kind === 'ceo' ? '🏢' : kind === 'manager' ? '🧑‍💼' : '🧑';
  const url = src || (name ? `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(name)}&backgroundColor=eef2ff,fef3c7,dcfce7` : '');
  if (!url || failed) {
    return (
      <span className="inline-flex items-center justify-center rounded-full shrink-0"
        style={{ width: size, height: size, background: '#eef2ff', fontSize: Math.round(size * 0.55) }}>{emoji}</span>
    );
  }
  return (
    <img src={url} alt={name || ''} width={size} height={size} onError={() => setFailed(true)}
      className="rounded-full shrink-0 object-cover bg-white" style={{ width: size, height: size }} />
  );
}

// Read a local image file → center-crop + resize to a small square JPEG data URL.
// Kept tiny so it can live in the worker's `avatar` field without bloating the DB.
export function resizeImage(file: File, size = 96, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image file.')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable.')); return; }
        const min = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// Resize a logo while PRESERVING aspect ratio (unlike resizeImage which
// square-crops). Caps the longest edge to `maxEdge`. Keeps PNG transparency
// by emitting PNG. Returns a data URL safe to store in branding.logo_url.
export function resizeLogo(file: File, maxEdge = 320): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Please choose an image file.')); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable.')); return; }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.readAsDataURL(file);
  });
}

// An avatar you can click to upload a photo (camera overlay on hover).
export function AvatarUpload({ name, src, kind, size = 32, onPick }:
  { name?: string; src?: string; kind?: 'ceo' | 'manager' | 'expert'; size?: number; onPick: (file: File) => void }) {
  return (
    <label className="relative inline-flex cursor-pointer group shrink-0" title="Upload a photo">
      <Avatar name={name} src={src} kind={kind} size={size} />
      <span className="absolute inset-0 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100"
        style={{ background: 'rgba(0,0,0,0.45)', fontSize: Math.round(size * 0.4) }}>📷</span>
      <input type="file" accept="image/*" className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) onPick(file); e.target.value = ''; }} />
    </label>
  );
}

// Voice dictation button — uses the browser's built-in Web Speech API (no backend
// or API key). Calls onText with the recognised speech; renders nothing if the
// browser doesn't support it (Safari/Chrome/Edge do).
export function MicButton({ onText, size = 30 }: { onText: (text: string) => void; size?: number }) {
  const [listening, setListening] = React.useState(false);
  const [supported, setSupported] = React.useState(true);
  const cbRef = React.useRef(onText); cbRef.current = onText;
  const recRef = React.useRef<any>(null);

  React.useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim();
      if (t) cbRef.current(t);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch { /* noop */ } };
  }, []);

  if (!supported) return null;
  const toggle = () => {
    const rec = recRef.current; if (!rec) return;
    if (listening) { try { rec.stop(); } catch { /* noop */ } setListening(false); }
    else { try { rec.start(); setListening(true); } catch { /* noop */ } }
  };
  return (
    <button type="button" onClick={toggle} title={listening ? 'Stop dictation' : 'Dictate with your voice'}
      className={`shrink-0 inline-flex items-center justify-center rounded-full border ${listening ? 'animate-pulse' : ''}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.5),
        background: listening ? '#fee2e2' : '#fff', color: listening ? '#dc2626' : '#6b7280',
        borderColor: listening ? '#fca5a5' : '#d1d5db' }}>
      {listening ? '●' : '🎤'}
    </button>
  );
}

export interface TabDef { key: string; label: string; badge?: number; hint?: string }
// Underline tab bar used to host several panels under one page (Review, Activity).
// Segmented tab control. Renders each tab as a div (not a <button>) so the
// global button-flatten rule can't strip the active pill's fill/border.
export function Tabs({ tabs, active, onChange }:
  { tabs: TabDef[]; active: string; onChange: (k: string) => void }) {
  const cur = tabs.find((t) => t.key === active);
  return (
    <div>
      <div
        className="inline-flex items-center gap-1.5 rounded-xl"
        style={{ backgroundColor: '#f1f5f9', padding: 5, border: '1px solid #e2e8f0' }}
      >
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <div
              key={t.key}
              role="tab"
              tabIndex={0}
              aria-selected={on}
              onClick={() => onChange(t.key)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(t.key); } }}
              className="px-5 py-2.5 rounded-lg inline-flex items-center cursor-pointer select-none"
              style={on
                ? { backgroundColor: '#ffffff', color: '#5147e6', fontWeight: 600, fontSize: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.14)' }
                : { backgroundColor: 'transparent', color: '#64748b', fontWeight: 500, fontSize: '15px' }}
            >
              {t.label}
              {t.badge ? <span className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}>{t.badge}</span> : null}
            </div>
          );
        })}
      </div>
      {cur?.hint ? <p className="text-xs text-gray-400 mt-2">{cur.hint}</p> : null}
    </div>
  );
}

export function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <span
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className="inline-flex items-center cursor-pointer select-none"
      style={{
        width: 42, height: 24, borderRadius: 999, padding: 2,
        backgroundColor: on ? '#5147e6' : '#d1d5db', transition: 'background-color .15s',
      }}
    >
      <span style={{
        width: 20, height: 20, borderRadius: 999, backgroundColor: '#fff',
        transform: on ? 'translateX(18px)' : 'translateX(0)', transition: 'transform .15s',
        boxShadow: '0 1px 2px rgba(0,0,0,.3)',
      }} />
    </span>
  );
}
