'use client';

/**
 * Shared EntityList — generic Drupal-style list view for an entity type.
 *
 * Bind-mounted into every module frontend at /app/src/_shared/components/.
 * Uses the canonical /api/v1/development/entity-records endpoint, falling back
 * to gracefully showing an empty state if the entity uses a per-module table.
 *
 * Columns are derived from the field definitions for the entity, so the table
 * automatically reflects whatever fields are configured in
 * Settings → Backend → System Modules.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { api } from '@/lib/api';
import FileViewerModal from './FileViewerModal';
import RecordPreviewModal from './RecordPreviewModal';
import AiAssist from './AiAssist';
import { ensureVaultLockInstalled } from './vaultLock';

interface EntityListProps {
  entityType: string;       // e.g. 'applicants'
  title?: string;           // e.g. 'Applicants'
  newPath?: string;         // e.g. '/applicants/new'
  pageSize?: number;
  // Read-only views (derived ledgers, reports) — hide Add New + Import.
  readOnly?: boolean;
  // Explicit allow-list of field names to render as inline filter dropdowns.
  // When provided, overrides the auto-detected filterable fields. Pass an
  // empty array to disable inline filters entirely.
  filters?: string[];
  // Hide the date-range filter (default: shown when entity has a date field).
  hideDateFilter?: boolean;
}

interface FieldDef {
  id: string;
  field_name: string;
  field_label: string;
  field_type: string;
  display_order: number;
  is_visible: boolean;
}

interface EntityRecord {
  id: string;
  data?: any;
  created_at?: string;
  created_date?: string;
}

const PREFERRED_DISPLAY_FIELDS = [
  'name', 'title', 'subject',
  'first_name', 'middle_name', 'last_name', 'full_name',
  'email', 'company_name', 'account_name',
  'code', 'description',
];

export default function EntityList({
  entityType,
  title,
  newPath,
  pageSize = 50,
  readOnly = false,
  filters,
  hideDateFilter = false,
}: EntityListProps) {
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [fields, setFields] = useState<FieldDef[]>([]);
  // Lookup table for entity_reference cells: refTarget → recordId → label.
  // Populated once at load() time; used by cellValue to display names.
  const [refLookup, setRefLookup] = useState<Record<string, Record<string, string>>>({});
  // Bulk selection — tracks the IDs of rows the user has checked. Cleared
  // automatically when the records list reloads.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [previewRecord, setPreviewRecord] = useState<EntityRecord | null>(null);
  const [query, setQuery] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sentinel value used by the Status filter dropdown to surface expired
  // records (which are hidden by default). See the filter logic below.
  const EXPIRED_FILTER = '__expired__';

  // Find the first date-like field on a record that signals an expiration.
  const EXPIRY_FIELDS = ['expires_at', 'end_date', 'renewal_date', 'due_date'];
  const expiryFieldForEntity = fields.find(f => EXPIRY_FIELDS.includes(f.field_name));
  const recordExpiryDays = (rec: any): number | null => {
    if (!expiryFieldForEntity) return null;
    const v = rec?.[expiryFieldForEntity.field_name] ?? rec?.data?.[expiryFieldForEntity.field_name];
    if (!v) return null;
    const due = new Date(String(v));
    if (isNaN(due.getTime())) return null;
    return Math.round((due.getTime() - Date.now()) / 86400000);
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const heading = title || entityType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const addHref = newPath || `/${entityType.replace(/_/g, '-')}/new`;
  // Module code for AI gating is the first path segment (e.g. /pm/projects/new → "pm").
  const aiModule = addHref.replace(/^\//, '').split('/')[0] || entityType;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Field definitions → drive the table columns
      const fieldsResp = await axios.get('/api/v1/development/custom-fields/definitions', {
        params: { entity_type: entityType, is_visible: true, limit: 1000 },
      });
      const fieldsData: FieldDef[] = fieldsResp.data?.data || fieldsResp.data || [];
      const sortedFields = [...fieldsData].sort((a, b) => a.display_order - b.display_order);
      setFields(sortedFields);

      // Records — try per-module API first, then entity_records, then merge so legacy
      // records from either store are visible.
      const merged: EntityRecord[] = [];
      const seen = new Set<string>();

      const entityApi = (api as any)[entityType];
      if (entityApi?.list) {
        try {
          const r = await entityApi.list({ limit: pageSize });
          const list = Array.isArray(r.data) ? r.data : (r.data?.data || r.data?.items || []);
          for (const rec of list) {
            if (rec?.id && !seen.has(rec.id)) {
              seen.add(rec.id);
              merged.push(rec);
            }
          }
        } catch {
          /* fall through */
        }
      }

      // Per-module API derived from addHref:
      //   /sales/customers/new -> /api/v1/sales/customers
      try {
        const apiBase = '/api/v1' + addHref.replace(/\/new$/, '');
        const r = await axios.get(apiBase, {
          params: { organization_id: '00000000-0000-0000-0000-000000000000', limit: pageSize },
        });
        const list = Array.isArray(r.data) ? r.data
          : (r.data?.data || r.data?.items || r.data?.records || []);
        for (const rec of list) {
          if (rec?.id && !seen.has(rec.id)) {
            seen.add(rec.id);
            merged.push(rec);
          }
        }
      } catch { /* not all entities expose a per-module endpoint */ }

      try {
        const recsResp = await axios.get('/api/v1/development/entity-records', {
          params: { entity_type: entityType, limit: pageSize },
        });
        const recsData: EntityRecord[] = recsResp.data?.data || recsResp.data || [];
        for (const rec of recsData) {
          if (rec?.id && !seen.has(rec.id)) {
            seen.add(rec.id);
            merged.push(rec);
          }
        }
      } catch {
        /* swallow */
      }

      setRecords(merged);
      setSelected(new Set()); // any stale selections refer to refetched data

      // Resolve entity_reference columns: fetch referenced records and
      // build a (entityType → id → label) lookup so cells render the
      // record's name instead of its UUID.
      const refTargets = new Set<string>();
      for (const f of sortedFields) {
        if (f.field_type === 'entity_reference') {
          const pv = (f as any).picklist_values;
          const target = pv?.ref_target;
          if (target) refTargets.add(target);
        }
      }
      if (refTargets.size > 0) {
        const next: Record<string, Record<string, string>> = {};
        await Promise.all(Array.from(refTargets).map(async (target) => {
          try {
            const r = await axios.get('/api/v1/development/entity-records', {
              params: { entity_type: target, limit: 1000 },
            });
            const list = (r.data?.data ?? r.data ?? []) as any[];
            const byId: Record<string, string> = {};
            for (const rec of list) {
              const d = rec.data || {};
              const label = d.name || d.account_name || d.company_name || d.subject || d.title
                || `${d.first_name || ''} ${d.last_name || ''}`.trim()
                || rec.id;
              byId[rec.id] = label;
            }
            next[target] = byId;
          } catch { next[target] = {}; }
        }));
        setRefLookup(next);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const deleteOne = async (id: string): Promise<void> => {
    const entityApi = (api as any)[entityType];
    if (entityApi?.delete) {
      await entityApi.delete(id);
    } else {
      await axios.delete(`/api/v1/development/entity-records/${id}`, {
        params: {
          organization_id: '00000000-0000-0000-0000-000000000000',
          deleted_by: '00000000-0000-0000-0000-000000000001',
        },
      });
    }
  };

  // Open a record (e.g. an AI answer's cited source) in the View modal.
  const openRecordById = async (id: string) => {
    const existing = records.find((r) => r.id === id);
    if (existing) { setPreviewRecord(existing); return; }
    try {
      const r = await axios.get(`/api/v1/development/entity-records/${id}`);
      if (r.data?.id) setPreviewRecord(r.data);
    } catch { /* record not found / not accessible */ }
  };

  const handleDelete = async (rec: EntityRecord) => {
    if (!confirm('Delete this record?')) return;
    try {
      await deleteOne(rec.id);
      await load();
    } catch (err: any) {
      alert(`Delete failed: ${formatApiError(err)}`);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} record${selected.size === 1 ? '' : 's'}?`)) return;
    setBulkDeleting(true);
    const ids = Array.from(selected);
    let failed = 0;
    for (const id of ids) {
      try { await deleteOne(id); } catch { failed++; }
    }
    setBulkDeleting(false);
    if (failed > 0) alert(`Deleted ${ids.length - failed} of ${ids.length}. ${failed} failed.`);
    await load();
  };

  const handleBulkExport = () => {
    const cols = displayFields;
    const headers = cols.map(f => f.field_label);
    const csvEscape = (v: any): string => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const lines = [headers.map(csvEscape).join(',')];
    filteredRecords
      .filter(r => selected.has(r.id))
      .forEach(rec => {
        const flat: any = { ...(rec as any), ...((rec as any).data || {}) };
        lines.push(cols.map(f => csvEscape(flat[f.field_name])).join(','));
      });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entityType}-selected-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // FastAPI validation errors come back as an array of objects under
  // response.data.detail. Older endpoints return a plain string. Normalize.
  const formatApiError = (err: any): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail.map((d: any) => d?.msg || JSON.stringify(d)).join('; ');
    }
    if (detail && typeof detail === 'object') return JSON.stringify(detail);
    return err?.message || 'Unknown error';
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entityType]);

  // Pick up to 4 columns to show in the table
  // The category field (if the entity defines one) — used to populate the
  // category filter dropdown and to apply the filter.
  const categoryField = fields.find(f => f.field_name === 'category');
  const categoryOptions: string[] = (() => {
    if (!categoryField) return [];
    const pv = (categoryField as any).picklist_values;
    if (Array.isArray(pv)) return pv;
    if (pv?.options) return pv.options;
    const seen = new Set<string>();
    records.forEach(r => {
      const v = (r as any)?.category ?? (r as any)?.data?.category;
      if (v) seen.add(String(v));
    });
    return Array.from(seen).sort();
  })();

  // Auto-detect filterable fields on the entity. Any field that can sensibly
  // be filtered by a discrete value (picklist, boolean, or a text/lookup
  // field with low cardinality among the loaded records) becomes a toolbar
  // dropdown. High-cardinality identifiers (names, references, IDs, free
  // text) and numeric/long-form fields are excluded.
  const NON_FILTERABLE_NAMES = new Set([
    'id', 'name', 'title', 'subject', 'description', 'notes',
    'first_name', 'last_name', 'full_name',
    'email', 'phone', 'address', 'website',
    'username', 'password', 'url',
    'code', 'reference',
    'transaction_number', 'invoice_number', 'order_number', 'bill_number',
    'amount', 'quantity', 'price', 'cost', 'rate', 'tax', 'total', 'balance',
    'created_at', 'updated_at', 'last_modified_at',
    'created_by', 'last_modified_by',
    'is_deleted', 'deleted_at', 'deleted_by',
    'organization_id',
  ]);
  const isFilterableField = (f: FieldDef): boolean => {
    if (f.field_name === 'category') return false;
    if (NON_FILTERABLE_NAMES.has(f.field_name)) return false;
    if (f.field_type === 'textarea') return false;
    if (f.field_type === 'date' || f.field_type === 'datetime') return false;
    if (f.field_type === 'number' || f.field_type === 'currency' || f.field_type === 'decimal') return false;
    if (f.field_type === 'password' || f.field_type === 'secret') return false;
    if (f.field_type === 'file' || f.field_type === 'image') return false;
    // Only true categoricals become toolbar filters: picklists/selects and
    // booleans (e.g. Status, Priority, Type). Text, references, lookups and
    // numbers (e.g. "Account Ref", "Reference") are intentionally excluded to
    // keep tables uncluttered. A caller can still force fields via the `filters`
    // prop.
    if (f.field_type === 'picklist' || f.field_type === 'select') return true;
    if (f.field_type === 'boolean' || f.field_type === 'checkbox') return true;
    return false;
  };
  const extraFilterFields = (() => {
    // Caller-provided allow-list wins over auto-detection.
    if (Array.isArray(filters)) {
      const wanted = new Set(filters);
      return fields.filter(f => wanted.has(f.field_name));
    }
    return fields.filter(isFilterableField).slice(0, 4);
  })();
  const optionsFor = (f: FieldDef): string[] => {
    const pv = (f as any).picklist_values;
    if (Array.isArray(pv) && pv.length > 0) return pv;
    if (pv?.options) return pv.options;
    if (f.field_type === 'boolean' || f.field_type === 'checkbox') return ['true', 'false'];
    const seen = new Set<string>();
    for (const rec of records) {
      const v = (rec as any)?.[f.field_name] ?? (rec as any)?.data?.[f.field_name];
      if (v != null && v !== '') seen.add(String(v));
    }
    return Array.from(seen).sort();
  };
  const [extraFilters, setExtraFilters] = useState<Record<string, string>>({});

  // Primary date field — drives the date-range filter. We prefer the most
  // common "transaction-style" field names so the filter pairs naturally with
  // ledger/journal/invoice screens, then fall back to any date field.
  const DATE_FIELD_PRIORITIES = [
    'date', 'transaction_date', 'invoice_date', 'bill_date',
    'meeting_date', 'due_date', 'start_date',
  ];
  const primaryDateField = (() => {
    const datelike = fields.filter(f =>
      f.field_type === 'date' || f.field_type === 'datetime',
    );
    for (const name of DATE_FIELD_PRIORITIES) {
      const f = datelike.find(x => x.field_name === name);
      if (f) return f;
    }
    return datelike[0] || null;
  })();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Client-side filter: substring match, category match, extra picklist
  // filters, and expiry filter.
  const filteredRecords = (() => {
    const q = query.trim().toLowerCase();
    return records.filter(rec => {
      const flat = { ...(rec as any), ...((rec as any).data || {}) };
      if (category) {
        const recCat = (rec as any)?.category ?? (rec as any)?.data?.category;
        if (String(recCat || '') !== category) return false;
      }
      // The "Expired" choice in the Status dropdown is a synthetic filter: it
      // doesn't match a stored value, it selects records past their expiry.
      const wantExpired = Object.values(extraFilters).includes(EXPIRED_FILTER);
      for (const fname of Object.keys(extraFilters)) {
        const want = extraFilters[fname];
        if (!want || want === EXPIRED_FILTER) continue;
        const got = (rec as any)?.[fname] ?? (rec as any)?.data?.[fname];
        if (String(got || '') !== want) return false;
      }
      if (primaryDateField && (dateFrom || dateTo)) {
        const raw = (rec as any)?.[primaryDateField.field_name]
          ?? (rec as any)?.data?.[primaryDateField.field_name];
        const day = raw ? String(raw).slice(0, 10) : '';
        if (!day) return false;
        if (dateFrom && day < dateFrom) return false;
        if (dateTo && day > dateTo) return false;
      }
      // Expiry is treated as a filter, not an auto-hide: every record shows by
      // default (overdue ones are still tinted red + badged in the table), and
      // the "Expired" status choice narrows the view to only past-expiry rows.
      // This keeps the list count in sync with the dashboard KPIs.
      if (wantExpired) {
        const days = recordExpiryDays(rec);
        if (days === null || days >= 0) return false;
      }
      if (!q) return true;
      return Object.values(flat).some(v =>
        v != null && String(v).toLowerCase().includes(q),
      );
    });
  })();


  // Print: open a stripped-down new window with just the table content.
  const handlePrint = () => {
    const cols = displayFields;
    const rowsHtml = filteredRecords.map(rec => {
      const flat: any = { ...(rec as any), ...((rec as any).data || {}) };
      return '<tr>' + cols.map(f => {
        let v = flat[f.field_name];
        if (v == null || v === '') v = '';
        // Mask password-like fields in print output.
        if (f.field_type === 'password' || f.field_type === 'secret') v = v ? '••••••••' : '';
        return `<td style="padding:6px 10px;border:1px solid #ccc">${String(v).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c] as string))}</td>`;
      }).join('') + '</tr>';
    }).join('');
    const headHtml = cols.map(f => `<th style="text-align:left;padding:6px 10px;border:1px solid #ccc;background:#f3f4f6">${f.field_label}</th>`).join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>${heading}</title>
      <style>body{font-family:Arial,sans-serif;color:#000;margin:24px}h1{margin:0 0 12px}table{width:100%;border-collapse:collapse;font-size:12px}</style>
    </head><body>
      <h1>${heading}</h1>
      <table><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
      <script>window.onload=function(){setTimeout(function(){window.print();},150);}</script>
    </body></html>`);
    w.document.close();
  };

  // Minimal CSV parser: supports quoted values and embedded commas. Doesn't
  // handle escaped quotes inside fields beyond the standard "" form.
  const parseCSV = (text: string): string[][] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else {
          cur += c;
        }
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(cur); cur = '';
      } else if (c === '\n' || c === '\r') {
        if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); row = []; cur = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else {
        cur += c;
      }
    }
    if (cur !== '' || row.length > 0) { row.push(cur); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim() !== ''));
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    setImportMsg('Reading file…');
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) { setImportMsg('CSV has no data rows'); return; }
      const headers = rows[0].map(h => h.trim());
      // Map each CSV header to a field_name. Match by field_name first,
      // then by field_label (case-insensitive).
      const fieldByName: Record<string, FieldDef> = {};
      for (const f of fields) {
        fieldByName[f.field_name.toLowerCase()] = f;
        fieldByName[f.field_label.toLowerCase()] = f;
      }
      const columnMap = headers.map(h => fieldByName[h.toLowerCase()]?.field_name);
      const orgId = '00000000-0000-0000-0000-000000000000';
      const createdBy = '00000000-0000-0000-0000-000000000001';
      let ok = 0; let fail = 0;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const payload: Record<string, any> = {};
        row.forEach((val, idx) => {
          const fieldName = columnMap[idx];
          if (fieldName && val !== '') payload[fieldName] = val;
        });
        if (Object.keys(payload).length === 0) continue;
        // Derive the per-entity API base from addHref:
        //   /administration/credentials/new  →  /api/v1/administration/credentials
        const apiBase = '/api/v1' + addHref.replace(/\/new$/, '');
        try {
          await axios.post(apiBase, payload, {
            params: { organization_id: orgId, created_by: createdBy },
          });
          ok++;
        } catch {
          fail++;
        }
        setImportMsg(`Importing… ${ok + fail}/${rows.length - 1} rows`);
      }
      setImportMsg(`Imported ${ok} rows${fail ? ` (${fail} failed)` : ''}`);
      await load();
      setTimeout(() => setImportMsg(null), 4000);
    } catch (err: any) {
      setImportMsg(`Import failed: ${err?.message || 'unknown error'}`);
    }
  };

  // Show up to 8 visible fields. Long-form fields (textareas) and metadata
  // fields like `uploaded_date`/`uploaded_at` are skipped — they're still
  // present in the form and preview modal, just not in the list view.
  const LIST_HIDDEN_FIELDS = new Set([
    'uploaded_date', 'uploaded_at',
    'created_at', 'updated_at', 'last_modified_at',
    'created_by', 'last_modified_by',
    'is_deleted', 'deleted_at', 'deleted_by',
    'organization_id',
    // Connection details are configuration, not look-up data — keep them
    // available in the form and preview, but not in the table.
    'host', 'port', 'auth_method',
    'public_key', 'key_passphrase', 'api_token', 'connection_string',
    'domain', 'region',
    'two_factor_backup', 'security_questions',
  ]);
  const displayFields = (() => {
    if (fields.length === 0) return [];
    const usable = fields.filter(f =>
      f.field_type !== 'textarea' && !LIST_HIDDEN_FIELDS.has(f.field_name),
    );
    const preferred = usable.filter(f => PREFERRED_DISPLAY_FIELDS.includes(f.field_name));
    const remainder = usable.filter(f => !PREFERRED_DISPLAY_FIELDS.includes(f.field_name));
    return [...preferred, ...remainder].slice(0, 8);
  })();

  const cellValue = (rec: any, field: FieldDef) => {
    const fieldName = field.field_name;
    // per-module records have flat fields; entity_records nests under .data
    const v = rec?.[fieldName] ?? rec?.data?.[fieldName];
    if (v === null || v === undefined || v === '') return '—';
    // Reference column: show the referenced record's name from the lookup
    // built at load() time, falling back to the raw value if not resolved.
    if (field.field_type === 'entity_reference') {
      const target = (field as any).picklist_values?.ref_target;
      if (target && refLookup[target]) {
        return refLookup[target][String(v)] || String(v);
      }
    }
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  // True when the value looks like a file/URL we should render clickable.
  const isLinkValue = (v: any): v is string =>
    typeof v === 'string' && (v.startsWith('/uploads/') || v.startsWith('http://') || v.startsWith('https://'));

  // Inline text cell with a copy button — used for usernames in credentials.
  const CopyableCell = ({ value }: { value: any }) => {
    const [copied, setCopied] = React.useState(false);
    if (!value) return <span>—</span>;
    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    };
    return (
      <span className="inline-flex items-center gap-2">
        <span>{String(value)}</span>
        <button type="button" onClick={handleCopy} className="text-xs underline">
          {copied ? 'copied' : 'copy'}
        </button>
      </span>
    );
  };

  // Launch cell for credentials: opens the site in a new tab AND copies
  // the username to clipboard so the user only has to paste it in the
  // login form. Password is copied separately via the masked password cell.
  const LaunchCell = ({ url, username }: { url: string; username?: string }) => {
    const [status, setStatus] = React.useState<'' | 'opened' | 'copied'>('');
    const handleLaunch = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (username) {
        try { await navigator.clipboard.writeText(String(username)); } catch { /* ignore */ }
        setStatus('copied');
      } else {
        setStatus('opened');
      }
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => setStatus(''), 2500);
    };
    return (
      <span className="inline-flex items-center gap-2">
        <button type="button" onClick={handleLaunch} className="underline">Launch</button>
        {status === 'copied' && <span className="text-xs">user copied — paste with Cmd+V</span>}
        {status === 'opened' && <span className="text-xs">opened</span>}
      </span>
    );
  };

  // Inline password cell — masked by default, click to reveal/hide; copy button.
  // Auto-re-masks when the vault-lock event fires (idle timeout).
  const PasswordCell = ({ value }: { value: any }) => {
    const [show, setShow] = React.useState(false);
    const [copied, setCopied] = React.useState(false);
    React.useEffect(() => {
      ensureVaultLockInstalled();
      const onLock = () => setShow(false);
      window.addEventListener('vault-lock', onLock);
      return () => window.removeEventListener('vault-lock', onLock);
    }, []);
    if (!value) return <span>—</span>;
    const handleCopy = async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        await navigator.clipboard.writeText(String(value));
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch { /* ignore */ }
    };
    return (
      <span className="inline-flex items-center gap-2">
        <span className="font-mono">{show ? String(value) : '••••••••'}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); setShow(v => !v); }} className="text-xs underline">
          {show ? 'hide' : 'show'}
        </button>
        <button type="button" onClick={handleCopy} className="text-xs underline">
          {copied ? 'copied' : 'copy'}
        </button>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4">
        {/* Sub-section heading sits below the module tab bar, smaller than
            the module H1 so the visual hierarchy stays balanced. */}
        <h2 className="font-semibold mb-3" style={{ fontSize: '1rem' }}>
          {heading}
        </h2>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="px-3 py-1.5 text-sm"
              style={{ width: '12rem' }}
            />
            {/* Date-range filter — bound to the entity's primary date field
                (e.g. Transaction Date for ledger, Invoice Date for AR). */}
            {primaryDateField && !hideDateFilter && (
              <span className="inline-flex items-center gap-1 text-sm">
                <span className="text-gray-600">{primaryDateField.field_label}:</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1 text-sm"
                  title={`From ${primaryDateField.field_label}`}
                />
                <span>–</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1 text-sm"
                  title={`To ${primaryDateField.field_label}`}
                />
              </span>
            )}
            {/* If the entity has many category options keep it as a dropdown
                (saves space). Otherwise render as inline chips for one-click
                filtering. */}
            {categoryField && categoryOptions.length > 0 && categoryOptions.length > 6 && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-1.5 text-sm"
                title="Filter by category"
              >
                <option value="">All categories</option>
                {categoryOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}
            {/* Entity-specific picklist filters (Account Type, Status, etc.) */}
            {extraFilterFields.map(f => {
              const opts = optionsFor(f);
              if (opts.length === 0) return null;
              const allLabel = `All ${f.field_label}`;
              // Append "Expired" to the Status dropdown so expired records
              // (hidden by default) can be surfaced without a separate toggle.
              const isStatusField = f.field_name === 'status';
              return (
                <select
                  key={f.id}
                  value={extraFilters[f.field_name] || ''}
                  onChange={(e) =>
                    setExtraFilters(prev => ({ ...prev, [f.field_name]: e.target.value }))
                  }
                  className="px-3 py-1.5 text-sm"
                  title={`Filter by ${f.field_label}`}
                >
                  <option value="">{allLabel}</option>
                  {opts.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  {isStatusField && expiryFieldForEntity && (
                    <option value={EXPIRED_FILTER}>Expired</option>
                  )}
                </select>
              );
            })}
            {!readOnly && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm"
                  title="Import CSV — first row is column headers matching field names or labels"
                >
                  Import
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handlePrint}
              disabled={filteredRecords.length === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm"
              title="Open a print-friendly view of the visible rows"
            >
              Print
            </button>
            <AiAssist module={aiModule} entityType={entityType} sectionLabel={heading} onOpenRecord={openRecordById} />
            {!readOnly && (
              <Link
                href={addHref}
                className="add-new-btn text-sm"
                title={`Add a new ${heading.replace(/s$/, '') || 'record'}`}
              >
                <span className="add-new-plus" aria-hidden="true">+</span>
                Add New
              </Link>
            )}
          </div>
        </div>

        {importMsg && (
          <div className="mb-3 p-2 text-sm">{importMsg}</div>
        )}

        {/* Inline category chips when there are 6 or fewer options */}
        {categoryField && categoryOptions.length > 0 && categoryOptions.length <= 6 && (
          <div className="flex flex-wrap gap-2 mb-3 text-sm">
            <button
              type="button"
              onClick={() => setCategory('')}
              className="px-3 py-1"
              style={category === ''
                ? { backgroundColor: '#5147e6', color: '#ffffff', fontWeight: 600 }
                : { backgroundColor: '#ffffff' }}
            >
              All
            </button>
            {categoryOptions.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => setCategory(opt)}
                className="px-3 py-1"
                style={category === opt
                  ? { backgroundColor: '#5147e6', color: '#ffffff', fontWeight: 600 }
                  : { backgroundColor: '#ffffff' }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
            {error}
          </div>
        )}

        {fields.length === 0 && !loading && !error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-sm text-yellow-800">
            <p className="font-medium">No fields defined for &quot;{entityType}&quot;.</p>
            <p className="mt-1">
              Go to <strong>Settings → Backend → System Modules</strong> and either add fields
              manually or click <strong>Auto-generate fields for all</strong>.
            </p>
          </div>
        )}

        {/* Bulk-selection action bar — appears only when rows are checked.
            Sticky-style: sits between the toolbar and the table. */}
        {selected.size > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2 mb-3 text-sm"
            style={{ backgroundColor: '#5147e6', color: '#ffffff' }}
            data-on-dark
          >
            <span style={{ fontWeight: 600 }}>
              {selected.size} selected
            </span>
            <button
              type="button"
              onClick={handleBulkExport}
              className="bulk-bar-btn px-2 py-1 text-xs font-semibold"
              style={{ backgroundColor: '#ffffff', color: '#5147e6' }}
            >
              Export selected
            </button>
            {!readOnly && (
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="bulk-bar-btn bulk-bar-btn-danger px-2 py-1 text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
              >
                {bulkDeleting ? 'Deleting…' : 'Delete selected'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="bulk-bar-link px-2 py-1 text-xs underline"
            >
              Clear
            </button>
          </div>
        )}

        {fields.length > 0 && (
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-3 py-2" style={{ width: '2.25rem' }}>
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={filteredRecords.length > 0 && filteredRecords.every(r => selected.has(r.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelected(new Set(filteredRecords.map(r => r.id)));
                        } else {
                          setSelected(new Set());
                        }
                      }}
                    />
                  </th>
                  <th className="text-left px-4 py-2 font-medium text-gray-700" style={{ width: '3rem' }}>S.#</th>
                  {displayFields.map(f => (
                    <th key={f.id} className="text-left px-4 py-2 font-medium text-gray-700">
                      {f.field_label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-2 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && (
                  <tr>
                    <td colSpan={displayFields.length + 3} className="px-4 py-12 text-center text-gray-500">
                      Loading…
                    </td>
                  </tr>
                )}
                {!loading && records.length === 0 && (
                  <tr>
                    <td colSpan={displayFields.length + 3} className="px-4 py-12 text-center text-gray-500 italic">
                      No records yet. <Link href={addHref} className="text-blue-600 hover:underline">Add the first one →</Link>
                    </td>
                  </tr>
                )}
                {!loading && records.length > 0 && filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={displayFields.length + 3} className="px-4 py-12 text-center italic">
                      No records match "{query}".
                    </td>
                  </tr>
                )}
                {!loading && filteredRecords.map((rec, rowIdx) => {
                  const detailHref = `${addHref.replace(/\/new$/, '')}/${rec.id}`;
                  // Row-level expiry styling: tint background based on how
                  // close (or past) the expiration is.
                  const days = recordExpiryDays(rec);
                  let rowStyle: React.CSSProperties = {};
                  let badge: React.ReactNode = null;
                  if (days !== null) {
                    if (days < 0) {
                      rowStyle = { backgroundColor: '#fee2e2' };
                      badge = <span style={{ color: '#dc2626' }} className="ml-2 text-xs">expired {Math.abs(days)}d ago</span>;
                    } else if (days <= 7) {
                      rowStyle = { backgroundColor: '#fef3c7' };
                      badge = <span style={{ color: '#b45309' }} className="ml-2 text-xs">in {days}d</span>;
                    } else if (days <= 30) {
                      rowStyle = { backgroundColor: '#fffbeb' };
                      badge = <span style={{ color: '#a16207' }} className="ml-2 text-xs">in {days}d</span>;
                    }
                  }
                  const isSelected = selected.has(rec.id);
                  return (
                    <tr key={rec.id} style={rowStyle}>
                      <td className="px-3 py-2" style={{ width: '2.25rem' }}>
                        <input
                          type="checkbox"
                          aria-label={`Select row ${rowIdx + 1}`}
                          checked={isSelected}
                          onChange={(e) => {
                            setSelected(prev => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(rec.id);
                              else next.delete(rec.id);
                              return next;
                            });
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-2" style={{ width: '3rem' }}>{rowIdx + 1}</td>
                      {displayFields.map((f, idx) => {
                        const raw = (rec as any)?.[f.field_name] ?? (rec as any)?.data?.[f.field_name];
                        const isLink = isLinkValue(raw);
                        const isPassword = f.field_type === 'password' || f.field_type === 'secret';
                        // For credentials, the URL cell becomes a "Launch" action
                        // that opens the site and copies the username to clipboard.
                        const isCredentialUrl = entityType === 'credentials' && f.field_name === 'url' && isLink && raw.startsWith('http');
                        const isCredentialUsername = entityType === 'credentials' && f.field_name === 'username';
                        const linkLabel = isLink
                          ? (raw.startsWith('/uploads/') ? 'Internal' : 'External')
                          : null;
                        return (
                          <td key={f.id} className="px-4 py-2">
                            {isPassword ? (
                              <PasswordCell value={raw} />
                            ) : isCredentialUsername ? (
                              <CopyableCell value={raw} />
                            ) : isCredentialUrl ? (
                              <LaunchCell url={raw} username={(rec as any)?.username ?? (rec as any)?.data?.username} />
                            ) : isLink ? (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setViewerUrl(raw); }}
                                className="underline"
                              >
                                {linkLabel}
                              </button>
                            ) : (
                              <Link href={detailHref} className="hover:underline">
                                {cellValue(rec, f)}
                              </Link>
                            )}
                            {idx === 0 && badge}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setPreviewRecord(rec)}
                          className="underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {viewerUrl && (
        <FileViewerModal url={viewerUrl} onClose={() => setViewerUrl(null)} />
      )}
      {previewRecord && (
        <RecordPreviewModal
          record={previewRecord}
          fields={fields}
          entityType={entityType}
          module={aiModule}
          sectionLabel={heading}
          onClose={() => setPreviewRecord(null)}
          onEdit={() => {
            const id = (previewRecord as any).id;
            setPreviewRecord(null);
            if (id) window.location.href = `${addHref.replace(/\/new$/, '')}/${id}`;
          }}
          onDelete={async () => {
            const rec = previewRecord;
            setPreviewRecord(null);
            if (rec) await handleDelete(rec);
          }}
        />
      )}
    </div>
  );
}
