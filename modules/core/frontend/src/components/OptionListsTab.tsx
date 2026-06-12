'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, List as ListIcon } from 'lucide-react';
import { optionListsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface OptionListItem {
  id: string;
  option_value: string;
  option_label: string;
  display_order: number;
  is_active: boolean;
  is_default: boolean;
}

interface OptionList {
  id: string;
  list_code: string;
  list_name: string;
  list_label: string;
  description?: string;
  scope: string;
  is_active: boolean;
  items?: OptionListItem[];
}

export default function OptionListsTab() {
  const { user } = useAuth();
  const [lists, setLists] = useState<OptionList[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingList, setEditingList] = useState<OptionList | null>(null);
  const [formData, setFormData] = useState({
    list_code: '',
    list_name: '',
    list_label: '',
    description: '',
    scope: 'global',
    items: [{ option_value: '', option_label: '', display_order: 0 }]
  });

  useEffect(() => {
    loadLists();
  }, []);

  const loadLists = async () => {
    try {
      setLoading(true);
      const orgId = (user as any)?.org_id || (user as any)?.organization_id;
      const response = await optionListsAPI.list({
        organization_id: orgId,
        include_system: true,
      });

      // Load items for each list
      const listsWithItems = await Promise.all(
        (response.data.lists || []).map(async (list: OptionList) => {
          try {
            const itemsResponse = await optionListsAPI.listItems(list.id);
            return { ...list, items: itemsResponse.data || [] };
          } catch (error) {
            return { ...list, items: [] };
          }
        })
      );

      setLists(listsWithItems);
    } catch (error) {
      console.error('Error loading lists:', error);
      setLists([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleList = (listId: string) => {
    const newExpanded = new Set(expandedLists);
    if (newExpanded.has(listId)) {
      newExpanded.delete(listId);
    } else {
      newExpanded.add(listId);
    }
    setExpandedLists(newExpanded);
  };

  const handleCreateList = async () => {
    try {
      const orgId = (user as any)?.org_id || (user as any)?.organization_id;
      const userId = user?.id || '';

      await optionListsAPI.create({
        ...formData,
        organization_id: orgId,
        created_by: userId,
      });

      setShowCreateModal(false);
      setFormData({
        list_code: '',
        list_name: '',
        list_label: '',
        description: '',
        scope: 'global',
        items: [{ option_value: '', option_label: '', display_order: 0 }]
      });
      await loadLists();
    } catch (error) {
      console.error('Error creating list:', error);
      alert('Failed to create list');
    }
  };

  const handleDeleteList = async (list: OptionList) => {
    if (!confirm(`Are you sure you want to delete the list "${list.list_name}"?`)) {
      return;
    }

    try {
      const userId = user?.id || '';
      await optionListsAPI.delete(list.id, userId);
      await loadLists();
    } catch (error) {
      console.error('Error deleting list:', error);
      alert('Failed to delete list');
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { option_value: '', option_label: '', display_order: formData.items.length }]
    });
  };

  const removeItemRow = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lists Management</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create List
        </button>
      </div>

      {/* Lists */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading lists...</div>
      ) : lists.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
          <ListIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Lists Yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {lists.map((list) => (
            <div key={list.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* List Header */}
              <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleList(list.id)}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {expandedLists.has(list.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-600" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    )}
                  </button>
                  <ListIcon className="w-5 h-5 text-blue-600" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{list.list_label}</div>
                    <div className="text-xs text-gray-600">
                      Code: {list.list_code} • Items: {list.items?.length || 0} • Scope: {list.scope}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDeleteList(list)}
                    className="p-2 hover:bg-red-100 rounded text-red-600"
                    title="Delete list"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List Items */}
              {expandedLists.has(list.id) && (
                <div className="p-4 bg-white border-t border-gray-200">
                  {list.items && list.items.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Value</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Label</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Order</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.items.map((item) => (
                          <tr key={item.id} className="border-t border-gray-100">
                            <td className="px-4 py-2 font-mono text-xs">{item.option_value}</td>
                            <td className="px-4 py-2">{item.option_label}</td>
                            <td className="px-4 py-2">{item.display_order}</td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 text-sm italic">No items in this list</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Create New List</h3>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Name*</label>
                  <input
                    type="text"
                    value={formData.list_name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        list_name: name,
                        list_label: name,  // mirror name as the display label internally
                        list_code: editingList ? prev.list_code : name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''),
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Countries"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">List Code*</label>
                  <input
                    type="text"
                    value={formData.list_code}
                    onChange={(e) => setFormData({ ...formData, list_code: e.target.value })}
                    disabled={!!editingList}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${editingList ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="auto-generated"
                  />
                  <p className="mt-1 text-xs text-gray-500">{editingList ? 'List code cannot be changed' : 'Auto-generated from name'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">List Items</label>
                <div className="space-y-2">
                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.option_value}
                        onChange={(e) => updateItem(index, 'option_value', e.target.value)}
                        placeholder="Value (e.g., us)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={item.option_label}
                        onChange={(e) => updateItem(index, 'option_label', e.target.value)}
                        placeholder="Label (e.g., United States)"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => removeItemRow(index)}
                          className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addItemRow}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    list_code: '',
                    list_name: '',
                    list_label: '',
                    description: '',
                    scope: 'global',
                    items: [{ option_value: '', option_label: '', display_order: 0 }]
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateList}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
