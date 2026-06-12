'use client';

/**
 * Shared DynamicEntityForm — canonical Drupal-style dynamic form.
 *
 * Bind-mounted into every module frontend at /app/src/_shared/components/.
 * Resolves `@/lib/api` against each module's own api.ts at build time, so
 * each module's per-entity API methods (e.g. api.accounts.create, api.customers.create)
 * are wired automatically via convention.
 */

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import { ensureVaultLockInstalled } from './vaultLock';

const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

interface DynamicEntityFormProps {
  entityType: string;
  entityId?: string;
  onSave?: (savedRecord: any) => void;
  onCancel?: () => void;
}

interface FieldDefinition {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  entity_type: string;
  is_required: boolean;
  is_visible: boolean;
  is_sensitive?: boolean;
  is_encrypted?: boolean;
  help_text?: string;
  default_value?: any;
  picklist_values?: any;
  display_order: number;
  field_group?: string;
}

/* -------- Password field renderer (strength + breach check) -------- */

function scoreStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '#e5e7eb' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (pwd.length >= 16) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  // Penalize common patterns
  if (/^(password|123456|qwerty|admin|letmein)/i.test(pwd)) score = Math.min(score, 1);
  if (/(.)\1{3,}/.test(pwd)) score = Math.max(0, score - 1);

  const buckets = [
    { label: 'Very weak', color: '#dc2626' },
    { label: 'Weak',      color: '#dc2626' },
    { label: 'Fair',      color: '#d97706' },
    { label: 'Good',      color: '#ca8a04' },
    { label: 'Strong',    color: '#01411C' },
    { label: 'Very strong', color: '#01411C' },
  ];
  const idx = Math.min(score, buckets.length - 1);
  return { score, label: buckets[idx].label, color: buckets[idx].color };
}

async function sha1Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function PasswordField({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: any;
  onChange: (v: string) => void;
  className: string;
  placeholder?: string;
}) {
  const [show, setShow] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [breachCount, setBreachCount] = React.useState<number | null>(null);
  const [breachChecking, setBreachChecking] = React.useState(false);

  React.useEffect(() => {
    ensureVaultLockInstalled();
    const onLock = () => setShow(false);
    window.addEventListener('vault-lock', onLock);
    return () => window.removeEventListener('vault-lock', onLock);
  }, []);

  // Debounced HIBP check via k-anonymity API (only first 5 hash chars sent).
  React.useEffect(() => {
    if (!value || value.length < 4) { setBreachCount(null); return; }
    setBreachChecking(true);
    const handle = setTimeout(async () => {
      try {
        const hash = await sha1Hex(String(value));
        const prefix = hash.slice(0, 5);
        const suffix = hash.slice(5);
        const resp = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, { headers: { 'Add-Padding': 'true' } });
        const text = await resp.text();
        const match = text.split('\n').find(line => line.startsWith(suffix));
        if (match) {
          const n = parseInt(match.split(':')[1] || '0', 10);
          setBreachCount(n > 0 ? n : null);
        } else {
          setBreachCount(0);
        }
      } catch {
        setBreachCount(null); // offline / blocked — silently skip
      } finally {
        setBreachChecking(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [value]);

  const strength = scoreStrength(String(value || ''));

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('Copy password:', value);
    }
  };
  const handleGenerate = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
    const buf = new Uint32Array(20);
    crypto.getRandomValues(buf);
    const pwd = Array.from(buf).map(n => chars[n % chars.length]).join('');
    onChange(pwd);
    setShow(true);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-stretch gap-2">
        <input
          type={show ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={className + ' flex-1'}
          autoComplete="new-password"
          placeholder={placeholder}
        />
        <button type="button" onClick={() => setShow(v => !v)} className="px-3">
          {show ? 'Hide' : 'Show'}
        </button>
        <button type="button" onClick={handleCopy} className="px-3" disabled={!value}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button type="button" onClick={handleGenerate} className="px-3" title="Generate strong password">
          Gen
        </button>
      </div>

      {/* Strength bar */}
      {value && (
        <div className="flex items-center gap-2 text-xs">
          <div style={{ width: '12rem', height: 4, background: '#e5e7eb' }}>
            <div style={{
              width: `${(strength.score / 5) * 100}%`,
              height: '100%',
              background: strength.color,
              transition: 'width 200ms ease',
            }} />
          </div>
          <span style={{ color: strength.color }}>{strength.label}</span>
          {breachChecking && <span>· checking breaches…</span>}
          {breachCount !== null && breachCount > 0 && (
            <span style={{ color: '#dc2626' }}>
              · ⚠ found in {breachCount.toLocaleString()} known breaches
            </span>
          )}
          {breachCount === 0 && !breachChecking && (
            <span style={{ color: '#01411C' }}>· no known breaches</span>
          )}
        </div>
      )}
    </div>
  );
}

/* -------- File upload field renderer -------- */

function FileUploadField({
  value,
  onChange,
  accept,
}: {
  value: any;
  onChange: (v: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handlePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const resp = await axios.post('/api/v1/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = resp.data?.url || resp.data?.data?.url;
      if (!url) throw new Error('Upload did not return a URL');
      onChange(url);
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept={accept}
        onChange={handlePick}
        disabled={uploading}
        className="block w-full text-sm border border-gray-300 p-2"
      />
      {uploading && <p className="text-xs">Uploading…</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {typeof value === 'string' && value && !uploading && (
        <p className="text-xs">
          <a href={value} target="_blank" rel="noreferrer" className="underline">{value}</a>
          <button
            type="button"
            onClick={() => onChange('')}
            className="ml-2 text-red-600 underline"
          >
            remove
          </button>
        </p>
      )}
    </div>
  );
}

/* -------- Reference field renderer -------- */

function ReferenceField({
  refTarget,
  value,
  onChange,
  className,
  helpText,
  refKind,
}: {
  refTarget: string;     // entity_type code, list_code, or '' for user
  value: any;
  onChange: (v: any) => void;
  className: string;
  helpText?: string;
  refKind: 'entity' | 'user' | 'list';
}) {
  const [options, setOptions] = useState<{ value: string; label: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (refKind === 'user') {
          const r = await axios.get('/api/v1/users');
          const items = (r.data?.data ?? r.data?.users ?? r.data ?? []) as any[];
          if (!cancelled) {
            setOptions(items.map((u: any) => ({
              value: u.id,
              label: u.full_name || u.name || `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || u.id,
            })));
          }
        } else if (refKind === 'list') {
          if (!refTarget) { setOptions([]); return; }
          // 1) resolve list_code → list id
          const listResp = await axios.get(`/api/v1/option-lists/code/${refTarget}`);
          const list = listResp.data?.data ?? listResp.data;
          if (!list?.id) { setOptions([]); return; }
          // 2) fetch items
          const itemsResp = await axios.get(`/api/v1/option-lists/${list.id}/items`, { params: { active_only: true } });
          const items = (itemsResp.data?.data ?? itemsResp.data?.items ?? itemsResp.data ?? []) as any[];
          if (!cancelled) {
            setOptions(items.map((it: any) => ({
              value: it.option_value ?? it.value ?? it.id,
              label: it.option_label ?? it.label ?? it.option_value ?? it.id,
            })));
          }
        } else {
          if (!refTarget) { setOptions([]); return; }
          const r = await axios.get('/api/v1/development/entity-records', { params: { entity_type: refTarget, limit: 1000 } });
          const items = (r.data?.data ?? r.data ?? []) as any[];
          if (!cancelled) {
            setOptions(items.map((rec: any) => {
              const d = rec.data || {};
              const label = d.name || d.account_name || d.company_name || d.subject || d.title
                || `${d.first_name || ''} ${d.last_name || ''}`.trim()
                || rec.id;
              return { value: rec.id, label };
            }));
          }
        }
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refTarget, refKind]);

  const placeholder = loading
    ? 'Loading…'
    : (helpText || `Select ${refKind === 'user' ? 'a user' : refKind === 'list' ? `from ${refTarget}` : refTarget}`);

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      disabled={loading}
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

/* -------- Main form -------- */

export default function DynamicEntityForm({
  entityType,
  entityId,
  onSave,
  onCancel,
}: DynamicEntityFormProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // AI-assisted data entry (only when creating a new record + AI enabled + can write)
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiFilling, setAiFilling] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  useEffect(() => { loadForm(); /* eslint-disable-line */ }, [entityType, entityId]);

  const aiModule = () => (typeof window !== 'undefined' ? window.location.pathname.replace(/^\//, '').split('/')[0] : '');
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

  useEffect(() => {
    if (entityId) return; // AI fill is for new records; editing uses AI Update
    let cancelled = false;
    (async () => {
      try {
        const mod = aiModule();
        const [setR, st] = await Promise.all([
          fetch(`/api/v1/ai/settings?module_code=${encodeURIComponent(mod)}`, { headers: authHeaders(false) }).then((r) => r.json()),
          fetch('/api/v1/ai/status', { headers: authHeaders(false) }).then((r) => r.json()),
        ]);
        const rows = setR.data || [];
        const variants = [entityType];
        const suffix = `_${mod}`; if (entityType.endsWith(suffix)) variants.push(entityType.slice(0, -suffix.length));
        const prefix = `${mod}_`; if (entityType.startsWith(prefix)) variants.push(entityType.slice(prefix.length));
        const enabledRow = rows.find((s: any) => variants.includes(s.entity_type) && s.enabled);
        const canWrite = (st?.access?.writes_require !== 'admin') || !!st?.me?.is_admin;
        if (!cancelled) setAiEnabled(!!enabledRow && canWrite);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [entityType, entityId]);

  // --- Attach a receipt/invoice photo + voice dictation for AI fill ----------
  const [aiImage, setAiImage] = useState<{ media_type: string; data: string; preview: string } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<'environment' | 'user'>('environment');
  const [streamTick, setStreamTick] = useState(0);
  const [listening, setListening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    setAiImage({ media_type: 'image/jpeg', data: dataUrl.split(',')[1] || '', preview: dataUrl });
  };
  const stopTracks = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  const closeCamera = () => { stopTracks(); setCameraOn(false); };
  const startStream = async (mode: 'environment' | 'user') => {
    setAiMsg(null);
    if (!navigator.mediaDevices?.getUserMedia) { setAiMsg('Camera not available in this browser. Use File instead.'); return; }
    stopTracks();
    try {
      let stream: MediaStream;
      try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: mode } }, audio: false }); }
      catch { stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
      streamRef.current = stream;
      setCameraOn(true);
      setStreamTick((t) => t + 1);
    } catch { setAiMsg('Could not open the camera (permission denied or no device). Use File instead.'); setCameraOn(false); }
  };
  const openCamera = () => { setFacing('environment'); startStream('environment'); };
  const flipCamera = () => { const next = facing === 'environment' ? 'user' : 'environment'; setFacing(next); startStream(next); };
  const capturePhoto = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) { setAiMsg('Camera still loading — wait a moment and try again.'); return; }
    setFromCanvas(v, v.videoWidth, v.videoHeight);
    closeCamera();
  };
  useEffect(() => {
    const v = videoRef.current;
    if (cameraOn && v && streamRef.current) { v.srcObject = streamRef.current; v.play().catch(() => {}); }
  }, [cameraOn, streamTick]);
  useEffect(() => () => stopTracks(), []);

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => setFromCanvas(img, img.width, img.height);
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

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
    baseInputRef.current = aiInput ? aiInput.replace(/\s*$/, '') + ' ' : '';
    rec.onresult = (e: any) => {
      let txt = '';
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setAiInput(baseInputRef.current + txt);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const aiFill = async () => {
    const text = aiInput.trim();
    if (!text && !aiImage) { setAiMsg('Describe the record or attach a photo first.'); return; }
    setAiFilling(true); setAiMsg(null);
    try {
      const context: Record<string, any> = { input: text };
      if (aiImage) context.image = { media_type: aiImage.media_type, data: aiImage.data };
      const r = await fetch('/api/v1/ai/preview', {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ capability: 'create_record', module_code: aiModule(), entity_type: entityType, context }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body?.detail || `Failed (${r.status})`);
      const draft = body.result || {};
      // Reference fields expect a record id; the model returns names, which would
      // break the picker widgets — leave those for the user to select manually.
      const REF_TYPES = new Set(['entity_reference', 'user_reference', 'list_reference']);
      const fillable = new Map(fields.filter((f) => !REF_TYPES.has(f.field_type)).map((f) => [f.field_name, f]));
      const filled: Record<string, any> = {};
      Object.entries(draft).forEach(([k, v]) => { if (fillable.has(k) && v != null && v !== '') filled[k] = v; });
      setFormData((prev) => ({ ...prev, ...filled }));
      const n = Object.keys(filled).length;
      setAiMsg(n ? `Filled ${n} field${n === 1 ? '' : 's'} — review and Save.` : 'Nothing to fill from that description.');
    } catch (e: any) {
      setAiMsg(e?.message || 'Could not fill from that description.');
    } finally {
      setAiFilling(false);
    }
  };

  const loadForm = async () => {
    try {
      setLoading(true);

      const fieldsResponse = await (api as any).customFields.listDefinitions({
        entity_type: entityType,
        is_visible: true,
      });

      // Different modules' api.ts return different shapes:
      //   axios pattern → { data: { data: [...] } }
      //   axios pattern (alt) → { data: [...] }
      //   fetch/fetchApi pattern → [...] directly
      const unwrap = (resp: any): any[] => {
        if (Array.isArray(resp)) return resp;
        if (Array.isArray(resp?.data)) return resp.data;
        if (Array.isArray(resp?.data?.data)) return resp.data.data;
        if (Array.isArray(resp?.data?.items)) return resp.data.items;
        return [];
      };
      const fieldsData = unwrap(fieldsResponse);

      const sortedFields = [...fieldsData].sort((a: FieldDefinition, b: FieldDefinition) => a.display_order - b.display_order);
      setFields(sortedFields);

      const initialData: Record<string, any> = {};
      sortedFields.forEach((field: FieldDefinition) => {
        if (field.field_type === 'checkbox' || field.field_type === 'boolean') {
          initialData[field.field_name] = field.default_value || false;
        } else {
          initialData[field.field_name] = field.default_value || '';
        }
      });

      if (entityId) {
        // Priority 1: per-module API (preserves domain logic for entities like job_requisitions, applicants).
        // Priority 2: canonical entity-records store (for custom/auto-generated entities).
        let loaded = false;
        try {
          const entityApi = (api as any)[entityType];
          if (entityApi?.get) {
            const recordResponse = await entityApi.get(entityId);
            if (recordResponse) {
              Object.assign(initialData, recordResponse.data || {});
              loaded = true;
            }
          }
        } catch {
          /* fall through */
        }
        if (!loaded) {
          try {
            const recordResp = await axios.get(`/api/v1/development/entity-records/${entityId}`);
            const record = recordResp.data?.data || recordResp.data;
            if (record?.data) Object.assign(initialData, record.data);
            else if (record) Object.assign(initialData, record);
          } catch (err) {
            console.error('Error loading existing record:', err);
          }
        }
      }

      setFormData(initialData);
    } catch (err) {
      console.error('Error loading form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    if (errors[fieldName]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      if (field.is_required) {
        const v = formData[field.field_name];
        if (v === undefined || v === null || v === '') {
          newErrors[field.field_name] = `${field.field_label} is required`;
        }
      }
      const v = formData[field.field_name];
      if (v) {
        switch (field.field_type) {
          case 'email':
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) newErrors[field.field_name] = 'Invalid email address';
            break;
          case 'url':
            try { new URL(v); } catch { newErrors[field.field_name] = 'Invalid URL'; }
            break;
          case 'number':
          case 'currency':
          case 'percentage':
            if (isNaN(parseFloat(v))) newErrors[field.field_name] = 'Must be a valid number';
            break;
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      // Priority 1: per-module API (preserves domain models, FK constraints, state machines).
      // Priority 2: canonical entity-records store (Drupal-style generic JSONB).
      const entityApi = (api as any)[entityType];
      let savedRecord: any;
      if (entityApi?.create && entityApi?.update) {
        const dataToSave = {
          ...formData,
          owner_id: TEMP_USER_ID,
          created_by: TEMP_USER_ID,
          last_modified_by: TEMP_USER_ID,
        };
        savedRecord = entityId
          ? await entityApi.update(entityId, dataToSave)
          : await entityApi.create(dataToSave);
      } else {
        savedRecord = entityId
          ? await axios.put(`/api/v1/development/entity-records/${entityId}`, {
              data: formData,
              last_modified_by: TEMP_USER_ID,
            })
          : await axios.post('/api/v1/development/entity-records', {
              entity_type: entityType,
              data: formData,
              created_by: TEMP_USER_ID,
            });
      }

      if (onSave) onSave(savedRecord);
    } catch (err: any) {
      console.error('Error saving record:', err);
      let errorMessage = 'Failed to save record. Please try again.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: any) => (typeof e === 'object' && e.msg ? `${e.loc ? e.loc.join('.') + ': ' : ''}${e.msg}` : String(e))).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: FieldDefinition) => {
    const value = formData[field.field_name] ?? '';
    const hasError = !!errors[field.field_name];
    const inputClass = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

    switch (field.field_type) {
      case 'text':
        return <input type="text" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} />;
      case 'textarea':
        return <textarea value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} rows={4} placeholder={field.help_text} />;
      case 'number':
      case 'currency':
      case 'percentage':
        return <input type="number" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} step={field.field_type === 'currency' ? '0.01' : 'any'} />;
      case 'email':
        return <input type="email" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} />;
      case 'phone':
        return <input type="tel" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} />;
      case 'url':
        return <input type="url" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} />;
      case 'password':
      case 'secret':
        return (
          <PasswordField
            value={value}
            onChange={(v) => handleFieldChange(field.field_name, v)}
            className={inputClass}
            placeholder={field.help_text}
          />
        );
      case 'file':
      case 'image':
        return (
          <FileUploadField
            value={value}
            accept={field.field_type === 'image' ? 'image/*' : undefined}
            onChange={(v) => handleFieldChange(field.field_name, v)}
          />
        );
      case 'date':
        return <input type="date" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} />;
      case 'datetime':
        return <input type="datetime-local" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} />;
      case 'checkbox':
      case 'boolean':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={!!value} onChange={(e) => handleFieldChange(field.field_name, e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm text-gray-700">{field.help_text || 'Yes'}</span>
          </label>
        );
      case 'select':
      case 'picklist':
      case 'dropdown': {
        const options = field.picklist_values?.options || (Array.isArray(field.picklist_values) ? field.picklist_values : []);
        return (
          <select value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass}>
            <option value="">-- Select {field.field_label} --</option>
            {options.map((opt: any, idx: number) => {
              const v = typeof opt === 'string' ? opt : opt.value;
              const l = typeof opt === 'string' ? opt : (opt.label || opt.value);
              return <option key={idx} value={v}>{l}</option>;
            })}
          </select>
        );
      }
      case 'multi_picklist': {
        const multi = field.picklist_values?.options || (Array.isArray(field.picklist_values) ? field.picklist_values : []);
        const selected = Array.isArray(value) ? value : [];
        return (
          <select multiple value={selected} onChange={(e) => {
            const sel = Array.from(e.target.selectedOptions, o => o.value);
            handleFieldChange(field.field_name, sel);
          }} className={`${inputClass} h-32`}>
            {multi.map((opt: any, idx: number) => {
              const v = typeof opt === 'string' ? opt : opt.value;
              const l = typeof opt === 'string' ? opt : (opt.label || opt.value);
              return <option key={idx} value={v}>{l}</option>;
            })}
          </select>
        );
      }
      case 'entity_reference':
        return (
          <ReferenceField
            refKind="entity"
            refTarget={field.picklist_values?.ref_target || ''}
            value={value}
            onChange={(v) => handleFieldChange(field.field_name, v)}
            className={inputClass}
            helpText={field.help_text}
          />
        );
      case 'user_reference':
        return (
          <ReferenceField
            refKind="user"
            refTarget=""
            value={value}
            onChange={(v) => handleFieldChange(field.field_name, v)}
            className={inputClass}
            helpText={field.help_text}
          />
        );
      case 'list_reference':
        return (
          <ReferenceField
            refKind="list"
            refTarget={field.picklist_values?.list_code || (field as any).list_code || ''}
            value={value}
            onChange={(v) => handleFieldChange(field.field_name, v)}
            className={inputClass}
            helpText={field.help_text}
          />
        );
      default:
        return <input type="text" value={value} onChange={(e) => handleFieldChange(field.field_name, e.target.value)} className={inputClass} placeholder={field.help_text} />;
    }
  };

  const groupedFields = fields.reduce((groups, field) => {
    const group = field.field_group || 'General';
    if (!groups[group]) groups[group] = [];
    groups[group].push(field);
    return groups;
  }, {} as Record<string, FieldDefinition[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800 font-medium">No fields defined for this entity</p>
        <p className="text-yellow-700 text-sm mt-2">
          Go to Settings → Backend → System Modules to add fields for &quot;{entityType}&quot;.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 measure">
      {aiEnabled && (
        <div className="rounded-lg p-3" style={{ border: '1px solid #5147e6', backgroundColor: '#eff5ff' }}>
          <div className="text-sm font-semibold mb-1 inline-flex items-center gap-1.5" style={{ color: '#5147e6' }}>
            <span className="inline-flex items-center justify-center rounded" style={{ width: 22, height: 22, backgroundColor: '#5147e6' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#ffffff" aria-hidden="true" style={{ verticalAlign: 'middle' }}>
                {/* Aladdin-style genie lamp */}
                <ellipse cx="11" cy="15" rx="7" ry="3.5" />
                <path d="M5 13.6C2.6 12.7 1.6 11.2 2.1 10.1l1.1.5c-.1.9.9 2.1 2.9 2.6z" />
                <path d="M17 13.7c3.9-1 3.9 3.7 0 2.7v-1.2c1.9.4 1.9-.7 0-.3z" />
                <path d="M8 12.2c.6-2.4 6.4-2.4 7 0z" />
                <circle cx="11.5" cy="9.1" r="1.05" />
                <path d="M11.5 10.1v1.2" stroke="#ffffff" strokeWidth="0.9" />
                <ellipse cx="11" cy="18.4" rx="3.4" ry="0.9" />
              </svg>
            </span>
            Fill with AI
          </div>
          <p className="text-xs text-gray-500 mb-2">Describe this record in plain language — or snap a receipt/invoice — and AI drafts the fields for you to review before saving.</p>
          <textarea
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            rows={2}
            placeholder={`e.g. "${entityType.replace(/_/g, ' ')} details…"`}
            className="w-full text-sm border border-gray-300 rounded px-2 py-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); aiFill(); } }}
          />

          {/* Attach a receipt / invoice photo for the AI to read */}
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
            ) : !aiImage ? (
              <div className="flex items-center gap-2">
                <label className="text-xs inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded cursor-pointer text-gray-600 bg-white" title="Upload an image file">
                  <span aria-hidden="true">📁</span> File
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.currentTarget.value = ''; }}
                  />
                </label>
                <button type="button" className="text-xs inline-flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-gray-600 bg-white" title="Open camera" onClick={openCamera}>
                  <span aria-hidden="true">📷</span> Camera
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <img src={aiImage.preview} alt="attachment" style={{ height: 44, width: 44, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
                <span className="text-xs text-gray-500">Image attached</span>
                <button type="button" className="text-xs text-red-600 underline" onClick={() => setAiImage(null)}>remove</button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center gap-2 mt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="ai-plan-btn text-sm disabled:opacity-60"
                disabled={aiFilling || (!aiInput.trim() && !aiImage)}
                onClick={aiFill}
              >
                {aiFilling ? 'Filling…' : 'Fill fields'}
              </button>
              {aiMsg && <span className="text-xs text-gray-600">{aiMsg}</span>}
            </div>
            {micSupported && (
              <span
                role="button"
                tabIndex={0}
                onClick={toggleMic}
                title={listening ? 'Stop dictation' : 'Speak the description'}
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
          </div>
        </div>
      )}
      {fields.map((field) => {
        const isSensitive =
          field.is_sensitive ||
          field.field_type === 'password' ||
          field.field_type === 'secret';
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">
              {field.field_label}
              {field.is_required && <span className="ml-1">*</span>}
              {isSensitive && (
                <span
                  className="ml-2 text-xs font-normal"
                  title="Stored encrypted at rest with AES-GCM"
                >
                  🔒 encrypted at rest
                </span>
              )}
            </label>
            {renderField(field)}
            {errors[field.field_name] && (
              <p className="text-sm mt-1">{errors[field.field_name]}</p>
            )}
          </div>
        );
      })}

      <div className="flex justify-end space-x-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
        )}
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : entityId ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
