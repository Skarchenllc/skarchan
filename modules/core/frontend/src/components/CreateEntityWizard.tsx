'use client';

/**
 * CreateEntityWizard — single-form scaffolding for a new entity_type.
 *
 * The entity in this system is defined by its rows in `custom_field_definitions`,
 * so creating an entity is really "create the field set". The wizard captures
 * the entity_type code + label + an initial list of fields, then POSTs each
 * field definition. The shared EntityList picks it up automatically via
 * the generic /modules/[module]/[entity] route — no per-entity page file
 * needs to be hand-rolled.
 */

import { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { customFieldsAPI, moduleBuilderAPI } from '@/lib/api';

type FieldRow = {
  id: string;          // stable React key
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  picklist_csv: string;          // for picklist/multi_picklist: comma-separated
  reference_target: string;      // for entity_reference: target entity_type
};

const FIELD_TYPES: { value: string; label: string }[] = [
  { value: 'text',             label: 'Text' },
  { value: 'textarea',         label: 'Text Area' },
  { value: 'number',           label: 'Number' },
  { value: 'currency',         label: 'Currency' },
  { value: 'percentage',       label: 'Percentage' },
  { value: 'date',             label: 'Date' },
  { value: 'datetime',         label: 'Date & Time' },
  { value: 'boolean',          label: 'Checkbox' },
  { value: 'picklist',         label: 'Dropdown (Single)' },
  { value: 'multi_picklist',   label: 'Dropdown (Multi)' },
  { value: 'email',            label: 'Email' },
  { value: 'phone',            label: 'Phone' },
  { value: 'url',              label: 'URL' },
  { value: 'entity_reference', label: 'Reference (FK)' },
];

const SYSTEM_USER = '00000000-0000-0000-0000-000000000001';

let rowSeq = 0;
const newRow = (overrides: Partial<FieldRow> = {}): FieldRow => ({
  id: `r${++rowSeq}`,
  field_name: '',
  field_label: '',
  field_type: 'text',
  is_required: false,
  picklist_csv: '',
  reference_target: '',
  ...overrides,
});

const toSnake = (s: string) => s
  .trim()
  .replace(/[A-Z]/g, c => '_' + c.toLowerCase())
  .replace(/[^a-z0-9_]+/g, '_')
  .replace(/^_+|_+$/g, '')
  .replace(/_{2,}/g, '_');

export default function CreateEntityWizard({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated?: (entityType: string, moduleCode?: string) => void;
}) {
  const [entityType, setEntityType] = useState('');
  const [entityLabel, setEntityLabel] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const [modules, setModules] = useState<{ module_code: string; module_label: string }[]>([]);
  const [refTargets, setRefTargets] = useState<string[]>([]);
  const [rows, setRows] = useState<FieldRow[]>([
    newRow({ field_name: 'name',   field_label: 'Name',   field_type: 'text',     is_required: true }),
    newRow({ field_name: 'status', field_label: 'Status', field_type: 'picklist', picklist_csv: 'Active, Inactive' }),
    newRow({ field_name: 'notes',  field_label: 'Notes',  field_type: 'textarea' }),
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const mods = await moduleBuilderAPI.listModules();
        const list = (mods.data?.data ?? mods.data ?? []) as any[];
        setModules(list.map(m => ({ module_code: m.module_code, module_label: m.module_label || m.module_name })));
      } catch { /* ignore */ }
      try {
        const ents = await moduleBuilderAPI.listEntityTypes();
        const list = (ents.data?.data ?? ents.data ?? []) as any[];
        setRefTargets(Array.from(new Set(list.map((e: any) => e.entity_type_code || e.entity_code).filter(Boolean))));
      } catch { /* ignore */ }
    })();
  }, []);

  // Auto-derive entity_type from the label as the user types — but only
  // if they haven't manually edited the code yet.
  const [codeIsDirty, setCodeIsDirty] = useState(false);
  useEffect(() => {
    if (!codeIsDirty && entityLabel) setEntityType(toSnake(entityLabel));
  }, [entityLabel, codeIsDirty]);

  const errors = useMemo(() => {
    const out: string[] = [];
    if (!entityType) out.push('Entity type code is required.');
    else if (!/^[a-z][a-z0-9_]*$/.test(entityType)) out.push('Entity type must be snake_case (lowercase letters, digits, underscores).');
    if (!entityLabel) out.push('Display label is required.');
    if (rows.length === 0) out.push('Add at least one field.');
    const names = new Set<string>();
    for (const r of rows) {
      if (!r.field_name) out.push('Every field needs a name.');
      else if (!/^[a-z][a-z0-9_]*$/.test(r.field_name)) out.push(`Field "${r.field_name}" must be snake_case.`);
      else if (names.has(r.field_name)) out.push(`Duplicate field name: ${r.field_name}.`);
      else names.add(r.field_name);
      if (!r.field_label) out.push(`Field "${r.field_name || '?'}" needs a label.`);
      if ((r.field_type === 'picklist' || r.field_type === 'multi_picklist') && !r.picklist_csv.trim()) {
        out.push(`Picklist "${r.field_name}" needs at least one option.`);
      }
      if (r.field_type === 'entity_reference' && !r.reference_target) {
        out.push(`Reference "${r.field_name}" needs a target entity.`);
      }
    }
    return Array.from(new Set(out));
  }, [entityType, entityLabel, rows]);

  const submit = async () => {
    if (errors.length > 0) return;
    setSaving(true);
    setError(null);
    try {
      // Submit fields sequentially so a duplicate-name response surfaces clearly.
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const payload: any = {
          entity_type: entityType,
          field_name: r.field_name,
          field_label: r.field_label,
          field_type: r.field_type,
          is_required: r.is_required,
          is_visible: true,
          display_order: (i + 1) * 10,
          created_by: SYSTEM_USER,
          last_modified_by: SYSTEM_USER,
        };
        if (r.field_type === 'picklist' || r.field_type === 'multi_picklist') {
          payload.picklist_values = r.picklist_csv.split(',').map(s => s.trim()).filter(Boolean);
        } else if (r.field_type === 'entity_reference') {
          payload.picklist_values = { ref_target: r.reference_target };
        }
        await customFieldsAPI.createDefinition(payload);
      }
      onCreated?.(entityType, moduleCode);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to create entity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-3xl mt-12 mb-12"
        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: '1px solid #e5e7eb' }}
        >
          <h2 className="text-base font-bold" style={{ color: '#5147e6' }}>
            Create New Entity
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-semibold block mb-1">Display Label</span>
              <input
                type="text"
                value={entityLabel}
                onChange={(e) => setEntityLabel(e.target.value)}
                placeholder="e.g. Service Tickets"
                className="w-full px-3 py-1.5 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold block mb-1">
                Entity Type Code <span className="text-xs font-normal italic" style={{ color: '#6b7280' }}>(snake_case)</span>
              </span>
              <input
                type="text"
                value={entityType}
                onChange={(e) => { setCodeIsDirty(true); setEntityType(e.target.value); }}
                placeholder="e.g. service_tickets"
                className="w-full px-3 py-1.5 text-sm"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold block mb-1">
              Parent Module <span className="text-xs font-normal italic" style={{ color: '#6b7280' }}>(optional)</span>
            </span>
            <select
              value={moduleCode}
              onChange={(e) => setModuleCode(e.target.value)}
              className="w-full px-3 py-1.5 text-sm"
            >
              <option value="">— None / standalone —</option>
              {modules.map(m => (
                <option key={m.module_code} value={m.module_code}>{m.module_label} ({m.module_code})</option>
              ))}
            </select>
          </label>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold">Fields</h3>
              <button
                type="button"
                onClick={() => setRows(prev => [...prev, newRow()])}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold"
                style={{ border: '1px solid #5147e6', color: '#5147e6' }}
              >
                <Plus className="w-3 h-3" /> Add field
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#f3f6fb' }}>
                    <th className="text-left px-2 py-1.5 font-semibold" style={{ width: '20%' }}>Name</th>
                    <th className="text-left px-2 py-1.5 font-semibold" style={{ width: '22%' }}>Label</th>
                    <th className="text-left px-2 py-1.5 font-semibold" style={{ width: '18%' }}>Type</th>
                    <th className="text-left px-2 py-1.5 font-semibold">Config</th>
                    <th className="text-left px-2 py-1.5 font-semibold" style={{ width: '4rem' }}>Req</th>
                    <th style={{ width: '2.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => {
                    const update = (patch: Partial<FieldRow>) =>
                      setRows(prev => prev.map(p => p.id === r.id ? { ...p, ...patch } : p));
                    const needsPicklist = r.field_type === 'picklist' || r.field_type === 'multi_picklist';
                    const needsRef = r.field_type === 'entity_reference';
                    return (
                      <tr key={r.id}>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={r.field_name}
                            onChange={(e) => update({ field_name: e.target.value })}
                            placeholder="snake_case"
                            className="w-full px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="text"
                            value={r.field_label}
                            onChange={(e) => update({ field_label: e.target.value })}
                            placeholder="Display label"
                            className="w-full px-2 py-1 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <select
                            value={r.field_type}
                            onChange={(e) => update({ field_type: e.target.value })}
                            className="w-full px-2 py-1 text-sm"
                          >
                            {FIELD_TYPES.map(t => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          {needsPicklist && (
                            <input
                              type="text"
                              value={r.picklist_csv}
                              onChange={(e) => update({ picklist_csv: e.target.value })}
                              placeholder="Option A, Option B, Option C"
                              className="w-full px-2 py-1 text-sm"
                            />
                          )}
                          {needsRef && (
                            <select
                              value={r.reference_target}
                              onChange={(e) => update({ reference_target: e.target.value })}
                              className="w-full px-2 py-1 text-sm"
                            >
                              <option value="">— Pick entity —</option>
                              {refTargets.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                          {!needsPicklist && !needsRef && (
                            <span className="text-xs italic" style={{ color: '#9ca3af' }}>—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={r.is_required}
                            onChange={(e) => update({ is_required: e.target.checked })}
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            type="button"
                            onClick={() => setRows(prev => prev.filter(p => p.id !== r.id))}
                            aria-label="Remove field"
                          >
                            <Trash2 className="w-4 h-4" style={{ color: '#dc2626' }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="text-xs space-y-0.5" style={{ color: '#b91c1c' }}>
              {errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
          {error && (
            <div className="p-2 text-sm" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
              {error}
            </div>
          )}
        </div>

        <div
          className="flex justify-end gap-2 px-5 py-3"
          style={{ borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm font-semibold"
            style={{ border: '1px solid #d1d5db' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving || errors.length > 0}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            style={{ backgroundColor: '#5147e6', color: '#ffffff' }}
          >
            {saving ? 'Creating…' : 'Create Entity'}
          </button>
        </div>
      </div>
    </div>
  );
}
