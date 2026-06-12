'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { MODULE_ENTITIES, getAllEntities } from '@/config/moduleEntities'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8011/api/v1'

interface WorkflowCondition {
  field: string
  operator: string
  value: any
  logic_operator?: string
}

interface WorkflowAction {
  action_type: string
  parameters: Record<string, any>
}

interface ActionTemplate {
  id: string
  action_name: string
  action_type: string
  action_category: string
  description: string
  parameters_schema: Record<string, any>
}

interface WorkflowRuleBuilderProps {
  workflowId?: string
  onClose: () => void
  onSave: () => void
}

export default function WorkflowRuleBuilder({ workflowId, onClose, onSave }: WorkflowRuleBuilderProps) {
  const allEntities = getAllEntities()
  const [selectedModule, setSelectedModule] = useState<string>('')
  const [ruleName, setRuleName] = useState('')
  const [description, setDescription] = useState('')
  const [entityType, setEntityType] = useState('')
  const [triggerType, setTriggerType] = useState('on_create')
  const [triggerField, setTriggerField] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [executionOrder, setExecutionOrder] = useState(0)
  const [scheduleCron, setScheduleCron] = useState('')
  const [conditions, setConditions] = useState<WorkflowCondition[]>([])
  const [actions, setActions] = useState<WorkflowAction[]>([])
  const [actionTemplates, setActionTemplates] = useState<ActionTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Filter entities by selected module
  const availableEntities = selectedModule
    ? allEntities.filter(e => e.module === selectedModule)
    : allEntities

  const triggerTypes = ['on_create', 'on_update', 'on_delete', 'on_field_change', 'scheduled']
  const operators = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does Not Contain' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal' },
    { value: 'is_null', label: 'Is Empty' },
    { value: 'is_not_null', label: 'Is Not Empty' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
  ]

  useEffect(() => {
    loadActionTemplates()
    if (workflowId) {
      loadWorkflow()
    }
  }, [workflowId])

  const loadActionTemplates = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/workflows/action-templates`)
      const data = await response.json()
      setActionTemplates(Array.isArray(data) ? data : (data.action_templates || data.templates || []))
    } catch (error) {
      console.error('Failed to load action templates:', error)
      setActionTemplates([])
    }
  }

  const loadWorkflow = async () => {
    if (!workflowId) return

    try {
      setLoading(true)
      const response = await fetch(`${API_BASE_URL}/workflows/${workflowId}`)
      const data = await response.json()

      // Find the module for the existing workflow's entity type
      const entity = allEntities.find(e => e.value === data.entity_type)
      if (entity) {
        setSelectedModule(entity.module)
      }

      setRuleName(data.rule_name)
      setDescription(data.description || '')
      setEntityType(data.entity_type)
      setTriggerType(data.trigger_type)
      setTriggerField(data.trigger_field || '')
      setIsActive(data.is_active)
      setExecutionOrder(data.execution_order)
      setScheduleCron(data.schedule_cron || '')
      setConditions(data.conditions || [])
      setActions(data.actions || [])
    } catch (error) {
      console.error('Failed to load workflow:', error)
      setError('Failed to load workflow')
    } finally {
      setLoading(false)
    }
  }

  const addCondition = () => {
    setConditions([
      ...conditions,
      { field: '', operator: 'equals', value: '', logic_operator: 'AND' }
    ])
  }

  const updateCondition = (index: number, field: keyof WorkflowCondition, value: any) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index))
  }

  const addAction = (templateType: string) => {
    const template = actionTemplates.find(t => t.action_type === templateType)
    if (!template) return

    const newAction: WorkflowAction = {
      action_type: templateType,
      parameters: {}
    }

    // Initialize parameters based on schema
    if (template.parameters_schema && template.parameters_schema.properties) {
      Object.keys(template.parameters_schema.properties).forEach(key => {
        const prop = template.parameters_schema.properties[key]
        newAction.parameters[key] = prop.default || ''
      })
    }

    setActions([...actions, newAction])
  }

  const updateAction = (index: number, parameters: Record<string, any>) => {
    const updated = [...actions]
    updated[index] = { ...updated[index], parameters }
    setActions(updated)
  }

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!ruleName.trim()) {
      setError('Rule name is required')
      return
    }

    if (conditions.length === 0) {
      setError('At least one condition is required')
      return
    }

    if (actions.length === 0) {
      setError('At least one action is required')
      return
    }

    try {
      setLoading(true)
      const payload = {
        rule_name: ruleName,
        description,
        entity_type: entityType,
        trigger_type: triggerType,
        trigger_field: triggerField || null,
        is_active: isActive,
        execution_order: executionOrder,
        conditions,
        actions,
        schedule_cron: scheduleCron || null,
        created_by: '00000000-0000-0000-0000-000000000001',
        last_modified_by: '00000000-0000-0000-0000-000000000001'
      }

      const url = workflowId
        ? `${API_BASE_URL}/workflows/${workflowId}`
        : `${API_BASE_URL}/workflows`

      const method = workflowId ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to save workflow')
      }

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Failed to save workflow:', error)
      setError(error.message || 'Failed to save workflow')
    } finally {
      setLoading(false)
    }
  }

  const getActionTemplateName = (actionType: string) => {
    const template = actionTemplates.find(t => t.action_type === actionType)
    return template?.action_name || actionType
  }

  const getActionParameterSchema = (actionType: string) => {
    const template = actionTemplates.find(t => t.action_type === actionType)
    return template?.parameters_schema || {}
  }

  if (loading && workflowId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-pulse">Loading workflow...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            {workflowId ? 'Edit Workflow' : 'Create Workflow'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Basic Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Auto-assign new leads to sales team"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Execution Order
                </label>
                <input
                  type="number"
                  value={executionOrder}
                  onChange={(e) => setExecutionOrder(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Describe what this workflow does..."
                />
              </div>
            </div>
          </div>

          {/* Trigger Configuration */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Configuration</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Module *
                </label>
                <select
                  value={selectedModule}
                  onChange={(e) => {
                    setSelectedModule(e.target.value)
                    setEntityType('') // Reset entity when module changes
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!!workflowId}
                >
                  <option value="">Select a module...</option>
                  {MODULE_ENTITIES.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>
                {workflowId && (
                  <p className="text-xs text-gray-500 mt-1">Module cannot be changed when editing</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entity Type *
                  </label>
                  <select
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!selectedModule || !!workflowId}
                  >
                    <option value="">
                      {selectedModule ? 'Select an entity...' : 'Select a module first...'}
                    </option>
                    {availableEntities.map(entity => (
                      <option key={entity.value} value={entity.value}>
                        {entity.label}
                      </option>
                    ))}
                  </select>
                  {workflowId && (
                    <p className="text-xs text-gray-500 mt-1">Entity cannot be changed when editing</p>
                  )}
                  {!workflowId && entityType && (
                    <p className="text-xs text-gray-500 mt-1">
                      {availableEntities.find(e => e.value === entityType)?.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger Type *
                  </label>
                  <select
                    value={triggerType}
                    onChange={(e) => setTriggerType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {triggerTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
                {triggerType === 'on_field_change' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Field
                    </label>
                    <input
                      type="text"
                      value={triggerField}
                      onChange={(e) => setTriggerField(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., status"
                    />
                  </div>
                )}
                {triggerType === 'scheduled' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cron Schedule
                    </label>
                    <input
                      type="text"
                      value={scheduleCron}
                      onChange={(e) => setScheduleCron(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 9 * * *"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Activate workflow immediately
              </label>
            </div>
          </div>

          {/* Conditions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conditions</h3>
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>

            {conditions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">No conditions yet. Add your first condition to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conditions.map((condition, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 rounded-lg">
                    {index > 0 && (
                      <select
                        value={condition.logic_operator || 'AND'}
                        onChange={(e) => updateCondition(index, 'logic_operator', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    )}
                    <input
                      type="text"
                      value={condition.field}
                      onChange={(e) => updateCondition(index, 'field', e.target.value)}
                      placeholder="Field name"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={condition.operator}
                      onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {operators.map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {!['is_null', 'is_not_null'].includes(condition.operator) && (
                      <input
                        type="text"
                        value={condition.value || ''}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Actions</h3>
              <div className="relative group">
                <button
                  type="button"
                  className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Action
                </button>
                <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10 hidden group-hover:block">
                  {actionTemplates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => addAction(template.action_type)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">{template.action_name}</div>
                      <div className="text-xs text-gray-600">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {actions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <p className="text-gray-600">No actions yet. Add your first action to complete the workflow.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {actions.map((action, index) => {
                  const schema = getActionParameterSchema(action.action_type)
                  const properties = schema.properties || {}

                  return (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-900">{getActionTemplateName(action.action_type)}</h4>
                        <button
                          type="button"
                          onClick={() => removeAction(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.keys(properties).map(paramKey => {
                          const param = properties[paramKey]
                          return (
                            <div key={paramKey}>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {param.title || paramKey}
                                {param.required && <span className="text-red-600">*</span>}
                              </label>
                              {param.type === 'boolean' ? (
                                <input
                                  type="checkbox"
                                  checked={action.parameters[paramKey] || false}
                                  onChange={(e) => updateAction(index, {
                                    ...action.parameters,
                                    [paramKey]: e.target.checked
                                  })}
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                              ) : param.enum ? (
                                <select
                                  value={action.parameters[paramKey] || ''}
                                  onChange={(e) => updateAction(index, {
                                    ...action.parameters,
                                    [paramKey]: e.target.value
                                  })}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                  <option value="">Select...</option>
                                  {param.enum.map((val: string) => (
                                    <option key={val} value={val}>{val}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={param.type === 'number' ? 'number' : 'text'}
                                  value={action.parameters[paramKey] || ''}
                                  onChange={(e) => updateAction(index, {
                                    ...action.parameters,
                                    [paramKey]: param.type === 'number' ? parseFloat(e.target.value) : e.target.value
                                  })}
                                  placeholder={param.description}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : workflowId ? 'Update Workflow' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
