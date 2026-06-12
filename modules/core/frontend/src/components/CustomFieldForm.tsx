'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { MODULE_ENTITIES, getAllEntities, MODULE_COLORS } from '@/config/moduleEntities';

interface PicklistOption {
  value: string;
  label: string;
}

interface CustomFieldFormProps {
  field?: any;
  entityType: string;  // The branch/sub-branch code this field belongs to
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
  inline?: boolean;  // If true, renders without modal wrapper
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', needsPicklist: false },
  { value: 'textarea', label: 'Text Area', needsPicklist: false },
  { value: 'number', label: 'Number', needsPicklist: false },
  { value: 'currency', label: 'Currency', needsPicklist: false },
  { value: 'percentage', label: 'Percentage', needsPicklist: false },
  { value: 'date', label: 'Date', needsPicklist: false },
  { value: 'datetime', label: 'Date & Time', needsPicklist: false },
  { value: 'boolean', label: 'Checkbox', needsPicklist: false },
  { value: 'picklist', label: 'Dropdown (Single)', needsPicklist: true },
  { value: 'multi_picklist', label: 'Dropdown (Multi)', needsPicklist: true },
  { value: 'email', label: 'Email', needsPicklist: false },
  { value: 'phone', label: 'Phone', needsPicklist: false },
  { value: 'url', label: 'URL', needsPicklist: false },
  { value: 'entity_reference', label: 'Reference: Entity', needsPicklist: false },
  { value: 'user_reference', label: 'Reference: User', needsPicklist: false },
  { value: 'list_reference', label: 'Reference: List', needsPicklist: false },
];

export default function CustomFieldForm({ field, entityType, onSave, onCancel, inline = false }: CustomFieldFormProps) {
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text',
    entity_type: entityType,  // Set from prop
    is_required: false,
    is_unique: false,
    is_searchable: true,
    is_visible: true,
    help_text: '',
    field_group: '',
    display_order: 0,
    picklist_values: [] as PicklistOption[],
    reference_target: '',  // For entity_reference: target entity_type code (e.g. 'accounts')
    list_code: '',         // For list_reference: target option_lists.list_code
  });

  // Available target entity types — populated from modules-with-entity-types
  const [availableEntityTypes, setAvailableEntityTypes] = useState<{value: string, label: string}[]>([]);
  // Available option_lists — for list_reference target
  const [availableLists, setAvailableLists] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    fetch('/api/v1/development/modules-with-entity-types')
      .then(r => r.json())
      .then((d: any) => {
        const modules = d?.data ?? d ?? [];
        const all: {value: string; label: string}[] = [];
        for (const mod of modules) {
          for (const c of mod.components || []) {
            all.push({ value: c.component_code, label: `${mod.module_label || mod.module_name} → ${c.component_label || c.component_name}` });
          }
        }
        all.sort((a, b) => a.label.localeCompare(b.label));
        setAvailableEntityTypes(all);
      })
      .catch(() => setAvailableEntityTypes([]));

    fetch('/api/v1/option-lists?include_system=true')
      .then(r => r.json())
      .then((d: any) => {
        const lists = d?.lists || d?.data || (Array.isArray(d) ? d : []);
        const opts = lists.map((l: any) => ({
          value: l.list_code,
          label: `${l.list_name || l.list_label || l.list_code} (${l.list_code})`,
        }));
        setAvailableLists(opts);
      })
      .catch(() => setAvailableLists([]));
  }, []);

  const [picklistInput, setPicklistInput] = useState({ value: '', label: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (field) {
      const refTarget = field.field_type === 'entity_reference'
        ? (field.picklist_values?.ref_target || '')
        : '';
      const listCode = field.field_type === 'list_reference'
        ? (field.picklist_values?.list_code || field.list_code || '')
        : '';
      const picklistArr = Array.isArray(field.picklist_values)
        ? field.picklist_values
        : (field.picklist_values?.options || []);

      setFormData({
        field_name: field.field_name || '',
        field_label: field.field_label || '',
        field_type: field.field_type || 'text',
        entity_type: entityType,
        is_required: field.is_required || false,
        is_unique: field.is_unique || false,
        is_searchable: field.is_searchable !== undefined ? field.is_searchable : true,
        is_visible: field.is_visible !== undefined ? field.is_visible : true,
        help_text: field.help_text || '',
        field_group: field.field_group || '',
        display_order: field.display_order || 0,
        picklist_values: picklistArr,
        reference_target: refTarget,
        list_code: listCode,
      });
    } else {
      setFormData(prev => ({ ...prev, entity_type: entityType }));
    }
  }, [field, entityType]);

  const needsPicklist = FIELD_TYPES.find(t => t.value === formData.field_type)?.needsPicklist;
  const isEntityRef = formData.field_type === 'entity_reference';
  const isListRef = formData.field_type === 'list_reference';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { reference_target, list_code, ...rest } = formData;
      const dataToSave: any = {
        ...rest,
        created_by: '00000000-0000-0000-0000-000000000001',
        last_modified_by: '00000000-0000-0000-0000-000000000001',
      };

      if (isEntityRef) {
        if (!reference_target) {
          alert('Please choose a target entity type for the reference.');
          setSaving(false);
          return;
        }
        dataToSave.picklist_values = { ref_target: reference_target };
      } else if (isListRef) {
        if (!list_code) {
          alert('Please choose a target list for the reference.');
          setSaving(false);
          return;
        }
        dataToSave.picklist_values = { list_code };
        dataToSave.list_code = list_code;  // also store on dedicated column
      } else if (!needsPicklist) {
        delete dataToSave.picklist_values;
      }

      await onSave(dataToSave);
    } catch (error: any) {
      console.error('Error saving field:', error);

      // Extract error message
      let errorMessage = 'Failed to save custom field';
      if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        } else if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((e: any) => e.msg || e.message).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const generateFieldName = (label: string) => {
    return 'custom_' + label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleLabelChange = (label: string) => {
    setFormData({
      ...formData,
      field_label: label,
      field_name: field ? formData.field_name : generateFieldName(label),
    });
  };

  const addPicklistOption = () => {
    if (!picklistInput.value || !picklistInput.label) {
      alert('Please provide both value and label for the option');
      return;
    }

    const exists = formData.picklist_values.some(opt => opt.value === picklistInput.value);
    if (exists) {
      alert('An option with this value already exists');
      return;
    }

    setFormData({
      ...formData,
      picklist_values: [...formData.picklist_values, picklistInput],
    });
    setPicklistInput({ value: '', label: '' });
  };

  const removePicklistOption = (value: string) => {
    setFormData({
      ...formData,
      picklist_values: formData.picklist_values.filter(opt => opt.value !== value),
    });
  };

  const formContent = (
    <form onSubmit={handleSubmit} className={inline ? "space-y-6" : "p-6 space-y-6"}>
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

            {/* Field Name (Label) - First */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.field_label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Customer Rating, Phone Number"
              />
              <p className="text-xs text-gray-500 mt-1">
                Display name shown to users
              </p>
            </div>

            {/* Field Machine Name - Auto-generated, shown for reference */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Schema Name
              </label>
              <input
                type="text"
                value={formData.field_name}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm cursor-not-allowed"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-generated database field name (cannot be changed)
              </p>
            </div>

            {/* Field Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Field Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.field_type}
                onChange={(e) => setFormData({ ...formData, field_type: e.target.value, picklist_values: [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!!field}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {field && (
                <p className="text-xs text-gray-500 mt-1">Field type cannot be changed after creation</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Help Text
              </label>
              <textarea
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="Help text to guide users when filling this field"
              />
            </div>
          </div>

          {/* Entity Reference target */}
          {isEntityRef && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Reference Target</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Entity Type *
                </label>
                <select
                  value={formData.reference_target}
                  onChange={(e) => setFormData({ ...formData, reference_target: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select target entity --</option>
                  {availableEntityTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  When users fill this field, they'll pick from existing records of this entity type.
                </p>
              </div>
            </div>
          )}

          {/* User Reference — no extra config needed */}
          {formData.field_type === 'user_reference' && (
            <div className="text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
              Users will pick from the platform&apos;s user list when filling this field.
            </div>
          )}

          {/* List Reference target */}
          {isListRef && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Reference Target</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target List *
                </label>
                <select
                  value={formData.list_code}
                  onChange={(e) => setFormData({ ...formData, list_code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">-- Select target list --</option>
                  {availableLists.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Users will pick a value from this Option List when filling this field.
                  {availableLists.length === 0 && (
                    <span className="block text-yellow-700 mt-1">
                      No lists found. Create one in Settings → Backend → Lists first.
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Picklist Options */}
          {needsPicklist && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Picklist Options</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={picklistInput.value}
                    onChange={(e) => setPicklistInput({ ...picklistInput, value: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., excellent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={picklistInput.label}
                      onChange={(e) => setPicklistInput({ ...picklistInput, label: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Excellent"
                    />
                    <button
                      type="button"
                      onClick={addPicklistOption}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {formData.picklist_values.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Options ({formData.picklist_values.length})</h4>
                  <div className="space-y-2">
                    {formData.picklist_values.map((option) => (
                      <div key={option.value} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                        <div className="flex items-center gap-3">
                          <code className="text-sm text-gray-600 bg-white px-2 py-1 rounded">{option.value}</code>
                          <span className="text-sm text-gray-900">{option.label}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePicklistOption(option.value)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organization */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Organization</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Group
                </label>
                <input
                  type="text"
                  value={formData.field_group}
                  onChange={(e) => setFormData({ ...formData, field_group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Customer Metrics"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* Field Properties */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Field Properties</h3>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_required}
                  onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Required Field</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_unique}
                  onChange={(e) => setFormData({ ...formData, is_unique: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Unique Values</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_searchable}
                  onChange={(e) => setFormData({ ...formData, is_searchable: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Searchable</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData({ ...formData, is_visible: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Visible on Forms</span>
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (needsPicklist && formData.picklist_values.length === 0) || (isEntityRef && !formData.reference_target) || (isListRef && !formData.list_code)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : field ? 'Update Field' : 'Create Field'}
            </button>
          </div>
        </form>
  );

  if (inline) {
    return formContent;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">
            {field ? 'Edit Custom Field' : 'Create Custom Field'}
          </h2>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        {formContent}
      </div>
    </div>
  );
}
