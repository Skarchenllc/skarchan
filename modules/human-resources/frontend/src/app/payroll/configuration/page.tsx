"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navigation from "@/components/Navigation";
import {
  Settings,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Check,
  Globe,
  DollarSign,
  Calculator,
  Eye,
  EyeOff,
} from "lucide-react";

interface PayrollComponent {
  id: string;
  code: string;
  name: string;
  type: "earning" | "pre_tax_deduction" | "tax" | "post_tax_deduction";
  category: string;
  calculationMethod: "percentage" | "fixed_amount" | "formula" | "hours_based";
  calculationValue?: number;
  calculationFormula?: string;
  baseComponent?: string;
  displayOrder: number;
  isVisible: boolean;
  isEditable: boolean;
  isRequired: boolean;
  colorCode: string;
  description?: string;
}

const componentTypes = [
  {
    value: "earning",
    label: "Earning / Addition",
    color: "green",
    bgClass: "bg-green-100",
    textClass: "text-green-800",
    borderClass: "border-green-300",
    description: "Increases gross pay (e.g., overtime, bonuses, allowances)",
    effect: "ADDS to pay"
  },
  {
    value: "pre_tax_deduction",
    label: "Pre-Tax Deduction",
    color: "purple",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-300",
    description: "Reduces taxable wages before tax calculation (e.g., 401k, health insurance)",
    effect: "REDUCES taxable income"
  },
  {
    value: "tax",
    label: "Tax",
    color: "red",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-300",
    description: "Government-mandated taxes (e.g., Federal, State, Social Security)",
    effect: "REDUCES net pay"
  },
  {
    value: "post_tax_deduction",
    label: "Post-Tax Deduction",
    color: "orange",
    bgClass: "bg-red-100",
    textClass: "text-red-800",
    borderClass: "border-red-300",
    description: "Deductions after tax calculation (e.g., parking, loans)",
    effect: "REDUCES net pay"
  },
];

const calculationMethods = [
  { value: "percentage", label: "Percentage of Base" },
  { value: "fixed_amount", label: "Fixed Amount" },
  { value: "formula", label: "Custom Formula" },
  { value: "hours_based", label: "Hours-Based Calculation" },
];

const countryTemplates = [
  {
    code: "USA",
    name: "United States",
    currency: "USD",
    components: [
      { code: "BASE_PAY", name: "Base Pay", type: "earning", calculationMethod: "hours_based", formula: "hourly_rate * regular_hours", order: 1, color: "#10b981" },
      { code: "OT_PAY", name: "Overtime Pay", type: "earning", calculationMethod: "hours_based", formula: "hourly_rate * 1.5 * overtime_hours", order: 2, color: "#f59e0b" },
      { code: "BONUS", name: "Bonus", type: "earning", calculationMethod: "fixed_amount", order: 3, color: "#10b981" },
      { code: "401K", name: "401(k) Contribution", type: "pre_tax_deduction", calculationMethod: "percentage", value: 6, order: 4, color: "#8b5cf6" },
      { code: "HEALTH_INS", name: "Health Insurance", type: "pre_tax_deduction", calculationMethod: "fixed_amount", value: 150, order: 5, color: "#8b5cf6" },
      { code: "FIT", name: "Federal Income Tax", type: "tax", calculationMethod: "percentage", value: 12, order: 6, color: "#ef4444" },
      { code: "SIT", name: "State Income Tax", type: "tax", calculationMethod: "percentage", value: 5, order: 7, color: "#ef4444" },
      { code: "FICA_SS", name: "Social Security", type: "tax", calculationMethod: "percentage", value: 6.2, order: 8, color: "#ef4444" },
      { code: "MEDICARE", name: "Medicare", type: "tax", calculationMethod: "percentage", value: 1.45, order: 9, color: "#ef4444" },
    ]
  },
  {
    code: "GBR",
    name: "United Kingdom",
    currency: "GBP",
    components: [
      { code: "BASIC_PAY", name: "Basic Pay", type: "earning", calculationMethod: "hours_based", order: 1, color: "#10b981" },
      { code: "PENSION", name: "Workplace Pension", type: "pre_tax_deduction", calculationMethod: "percentage", value: 5, order: 2, color: "#8b5cf6" },
      { code: "INCOME_TAX", name: "PAYE Income Tax", type: "tax", calculationMethod: "percentage", value: 20, order: 3, color: "#ef4444" },
      { code: "NI", name: "National Insurance", type: "tax", calculationMethod: "percentage", value: 12, order: 4, color: "#ef4444" },
    ]
  },
  {
    code: "CAN",
    name: "Canada",
    currency: "CAD",
    components: [
      { code: "REGULAR_PAY", name: "Regular Pay", type: "earning", calculationMethod: "hours_based", order: 1, color: "#10b981" },
      { code: "CPP", name: "Canada Pension Plan", type: "tax", calculationMethod: "percentage", value: 5.95, order: 2, color: "#ef4444" },
      { code: "EI", name: "Employment Insurance", type: "tax", calculationMethod: "percentage", value: 1.63, order: 3, color: "#ef4444" },
      { code: "FEDERAL_TAX", name: "Federal Income Tax", type: "tax", calculationMethod: "percentage", value: 15, order: 4, color: "#ef4444" },
      { code: "PROVINCIAL_TAX", name: "Provincial Income Tax", type: "tax", calculationMethod: "percentage", value: 5, order: 5, color: "#ef4444" },
    ]
  },
  {
    code: "IND",
    name: "India",
    currency: "INR",
    components: [
      { code: "BASIC_SALARY", name: "Basic Salary", type: "earning", calculationMethod: "fixed_amount", order: 1, color: "#10b981" },
      { code: "HRA", name: "House Rent Allowance", type: "earning", calculationMethod: "percentage", value: 40, order: 2, color: "#10b981" },
      { code: "DA", name: "Dearness Allowance", type: "earning", calculationMethod: "percentage", value: 10, order: 3, color: "#10b981" },
      { code: "PF", name: "Provident Fund", type: "pre_tax_deduction", calculationMethod: "percentage", value: 12, order: 4, color: "#8b5cf6" },
      { code: "ESI", name: "Employee State Insurance", type: "tax", calculationMethod: "percentage", value: 0.75, order: 5, color: "#ef4444" },
      { code: "TDS", name: "Tax Deducted at Source", type: "tax", calculationMethod: "percentage", value: 10, order: 6, color: "#ef4444" },
      { code: "PROF_TAX", name: "Professional Tax", type: "tax", calculationMethod: "fixed_amount", value: 200, order: 7, color: "#ef4444" },
    ]
  },
  {
    code: "AUS",
    name: "Australia",
    currency: "AUD",
    components: [
      { code: "ORDINARY_PAY", name: "Ordinary Time Earnings", type: "earning", calculationMethod: "hours_based", order: 1, color: "#10b981" },
      { code: "SUPER", name: "Superannuation (11%)", type: "pre_tax_deduction", calculationMethod: "percentage", value: 11, order: 2, color: "#8b5cf6" },
      { code: "PAYG", name: "PAYG Withholding Tax", type: "tax", calculationMethod: "percentage", value: 19, order: 3, color: "#ef4444" },
    ]
  },
  {
    code: "CUSTOM",
    name: "Custom Configuration",
    currency: "USD",
    components: []
  }
];

export default function PayrollConfigurationPage() {
  const router = useRouter();
  const [selectedCountry, setSelectedCountry] = useState("USA");
  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    earning: true,
    pre_tax_deduction: true,
    tax: true,
    post_tax_deduction: true,
  });
  const [editingComponent, setEditingComponent] = useState<PayrollComponent | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [configName, setConfigName] = useState("Default Configuration");

  useEffect(() => {
    // Load saved configuration from localStorage on mount
    const savedConfig = localStorage.getItem('payrollConfiguration');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        setComponents(config.components);
        setConfigName(config.name);
        setSelectedCountry(config.country);
      } catch (err) {
        console.error('Failed to load saved configuration', err);
        loadCountryTemplate(selectedCountry);
      }
    } else {
      loadCountryTemplate(selectedCountry);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadCountryTemplate(selectedCountry);
    }
  }, [selectedCountry]);

  const loadCountryTemplate = (countryCode: string) => {
    const template = countryTemplates.find(t => t.code === countryCode);
    if (template) {
      const mappedComponents: PayrollComponent[] = template.components.map((comp, idx) => ({
        id: `${comp.code}_${Date.now()}_${idx}`,
        code: comp.code,
        name: comp.name,
        type: comp.type as any,
        category: comp.code,
        calculationMethod: comp.calculationMethod as any,
        calculationValue: comp.value,
        calculationFormula: comp.formula,
        baseComponent: "gross_pay",
        displayOrder: comp.order,
        isVisible: true,
        isEditable: false,
        isRequired: true,
        colorCode: comp.color,
      }));
      setComponents(mappedComponents);
      setConfigName(`${template.name} Payroll Configuration`);
    }
  };

  const getComponentsByType = (type: string) => {
    return components
      .filter(c => c.type === type)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  };

  const toggleSection = (type: string) => {
    setExpandedSections(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const addNewComponent = () => {
    const newComponent: PayrollComponent = {
      id: `custom_${Date.now()}`,
      code: "",
      name: "",
      type: "earning",
      category: "",
      calculationMethod: "percentage",
      calculationValue: 0,
      baseComponent: "gross_pay",
      displayOrder: components.length + 1,
      isVisible: true,
      isEditable: true,
      isRequired: false,
      colorCode: "#10b981",
    };
    setEditingComponent(newComponent);
    setShowAddModal(true);
  };

  const saveComponent = () => {
    if (editingComponent) {
      if (editingComponent.id.startsWith('custom_') && !components.find(c => c.id === editingComponent.id)) {
        setComponents([...components, editingComponent]);
      } else {
        setComponents(components.map(c => c.id === editingComponent.id ? editingComponent : c));
      }
      setEditingComponent(null);
      setShowAddModal(false);
    }
  };

  const deleteComponent = (id: string) => {
    if (confirm("Are you sure you want to delete this component?")) {
      setComponents(components.filter(c => c.id !== id));
    }
  };

  const toggleVisibility = (id: string) => {
    setComponents(components.map(c =>
      c.id === id ? { ...c, isVisible: !c.isVisible } : c
    ));
  };

  const moveComponent = (id: string, direction: 'up' | 'down') => {
    const index = components.findIndex(c => c.id === id);
    if (index === -1) return;

    const newComponents = [...components];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newComponents.length) {
      [newComponents[index], newComponents[targetIndex]] = [newComponents[targetIndex], newComponents[index]];
      newComponents.forEach((c, idx) => c.displayOrder = idx + 1);
      setComponents(newComponents);
    }
  };

  const saveConfiguration = () => {
    const config = {
      name: configName,
      country: selectedCountry,
      components: components,
      savedAt: new Date().toISOString()
    };

    try {
      localStorage.setItem('payrollConfiguration', JSON.stringify(config));
      alert(`Configuration "${configName}" saved successfully!\n\n${components.length} components configured.\n\nThis configuration is now active for payroll processing.`);
      console.log("Saved configuration:", config);
    } catch (err) {
      console.error('Failed to save configuration', err);
      alert('Failed to save configuration. Please try again.');
    }
  };

  const getTypeLabel = (type: string) => {
    return componentTypes.find(t => t.value === type)?.label || type;
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case "earning": return "bg-green-50 text-green-700 border-green-200";
      case "pre_tax_deduction": return "bg-purple-50 text-purple-700 border-purple-200";
      case "tax": return "bg-red-50 text-red-700 border-red-200";
      case "post_tax_deduction": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Unified Card Design */}
        <div className="bg-white rounded-t-lg shadow">
          {/* Page Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Settings className="w-6 h-6 mr-2 text-blue-600" />
                  Payroll Configuration
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Customize payroll components for different countries and tax requirements
                </p>
              </div>
              <button
                onClick={saveConfiguration}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </div>

          {/* Configuration Settings */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Country Template
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  {countryTemplates.map(template => (
                    <option key={template.code} value={template.code}>
                      {template.name} ({template.currency})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration Name
                </label>
                <input
                  type="text"
                  value={configName}
                  onChange={(e) => setConfigName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Components
                </label>
                <div className="text-2xl font-bold text-blue-600">
                  {components.length}
                </div>
              </div>
            </div>
          </div>

          {/* Components List */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Payroll Components</h2>
              <button
                onClick={addNewComponent}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Component
              </button>
            </div>

            <div className="space-y-4">
              {componentTypes.map(typeObj => {
                const typeComponents = getComponentsByType(typeObj.value);
                if (typeComponents.length === 0 && typeObj.value !== 'earning') return null;

                return (
                  <div key={typeObj.value} className="border border-gray-300 rounded-lg overflow-hidden">
                    {/* Section Header */}
                    <div
                      onClick={() => toggleSection(typeObj.value)}
                      className={`px-4 py-3 cursor-pointer flex items-center justify-between ${getTypeColor(typeObj.value)} border-b border-gray-300`}
                    >
                      <div className="flex items-center">
                        {expandedSections[typeObj.value] ? (
                          <ChevronDown className="w-5 h-5 mr-2" />
                        ) : (
                          <ChevronUp className="w-5 h-5 mr-2" />
                        )}
                        <span className="font-semibold">{typeObj.label}</span>
                        <span className="ml-2 text-sm opacity-75">({typeComponents.length})</span>
                      </div>
                    </div>

                    {/* Components */}
                    {expandedSections[typeObj.value] && (
                      <div className="bg-white">
                        {typeComponents.length === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No components in this category. Click "Add Component" to create one.
                          </div>
                        ) : (
                          typeComponents.map((component, idx) => (
                            <div
                              key={component.id}
                              className="px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <GripVertical className="w-4 h-4 text-gray-400 mr-2" />
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <span className="font-medium text-gray-900">{component.name}</span>
                                      <span className="ml-2 text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                        {component.code}
                                      </span>
                                      {!component.isVisible && (
                                        <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                          Hidden
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {component.calculationMethod === "percentage" && (
                                        <span>{component.calculationValue}% of {component.baseComponent}</span>
                                      )}
                                      {component.calculationMethod === "fixed_amount" && (
                                        <span>${component.calculationValue} fixed</span>
                                      )}
                                      {component.calculationMethod === "formula" && (
                                        <span className="font-mono text-xs">{component.calculationFormula}</span>
                                      )}
                                      {component.calculationMethod === "hours_based" && (
                                        <span>{component.calculationFormula || "Hours × Rate"}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleVisibility(component.id)}
                                    className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                                    title={component.isVisible ? "Hide" : "Show"}
                                  >
                                    {component.isVisible ? (
                                      <Eye className="w-4 h-4" />
                                    ) : (
                                      <EyeOff className="w-4 h-4" />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => moveComponent(component.id, 'up')}
                                    disabled={idx === 0}
                                    className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                                  >
                                    <ChevronUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => moveComponent(component.id, 'down')}
                                    disabled={idx === typeComponents.length - 1}
                                    className="p-2 text-gray-600 hover:bg-gray-200 rounded disabled:opacity-30"
                                  >
                                    <ChevronDown className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingComponent(component);
                                      setShowAddModal(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteComponent(component.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview Section */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
            <div className="flex items-center text-sm text-blue-800">
              <Calculator className="w-4 h-4 mr-2" />
              <span className="font-medium">Configuration Preview:</span>
              <span className="ml-2">
                {components.filter(c => c.type === 'earning').length} Earnings,
                {components.filter(c => c.type === 'pre_tax_deduction').length} Pre-Tax,
                {components.filter(c => c.type === 'tax').length} Taxes,
                {components.filter(c => c.type === 'post_tax_deduction').length} Post-Tax
              </span>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && editingComponent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingComponent.id.startsWith('custom_') ? 'Add New Component' : 'Edit Component'}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Component Code</label>
                    <input
                      type="text"
                      value={editingComponent.code}
                      onChange={(e) => setEditingComponent({...editingComponent, code: e.target.value.toUpperCase()})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                      placeholder="e.g., CUSTOM_TAX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Component Name</label>
                    <input
                      type="text"
                      value={editingComponent.name}
                      onChange={(e) => setEditingComponent({...editingComponent, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="e.g., Custom Tax"
                    />
                  </div>
                </div>

                {/* Component Type Selection - Card-based with clear visual indicators */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Component Type <span className="text-red-600">*</span>
                    <span className="text-xs text-gray-500 ml-2">(Choose carefully - affects calculations and color)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {componentTypes.map(type => {
                      const isSelected = editingComponent.type === type.value;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setEditingComponent({...editingComponent, type: type.value as any})}
                          className={`p-3 border-2 rounded-lg text-left transition hover:shadow-md ${
                            isSelected
                              ? `${type.borderClass} ${type.bgClass} shadow-md`
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className={`font-semibold text-sm ${isSelected ? type.textClass : 'text-gray-700'}`}>
                              {type.label}
                            </span>
                            {isSelected && (
                              <Check className={`w-5 h-5 ${type.textClass}`} />
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {type.description}
                          </div>
                          <div className={`text-xs font-bold mt-2 ${
                            type.value === 'earning' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {type.effect}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Method</label>
                  <select
                    value={editingComponent.calculationMethod}
                    onChange={(e) => setEditingComponent({...editingComponent, calculationMethod: e.target.value as any})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  >
                    {calculationMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                </div>

                {(editingComponent.calculationMethod === "percentage" || editingComponent.calculationMethod === "fixed_amount") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {editingComponent.calculationMethod === "percentage" ? "Percentage (%)" : "Fixed Amount ($)"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editingComponent.calculationValue || 0}
                      onChange={(e) => setEditingComponent({...editingComponent, calculationValue: parseFloat(e.target.value)})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                )}

                {editingComponent.calculationMethod === "formula" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Formula</label>
                    <input
                      type="text"
                      value={editingComponent.calculationFormula || ""}
                      onChange={(e) => setEditingComponent({...editingComponent, calculationFormula: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
                      placeholder="e.g., gross_pay * 0.05"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Available variables: gross_pay, taxable_wages, hourly_rate, regular_hours, overtime_hours
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    value={editingComponent.description || ""}
                    onChange={(e) => setEditingComponent({...editingComponent, description: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    rows={2}
                    placeholder="Brief description of this component..."
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingComponent.isVisible}
                      onChange={(e) => setEditingComponent({...editingComponent, isVisible: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Visible in payroll</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingComponent.isEditable}
                      onChange={(e) => setEditingComponent({...editingComponent, isEditable: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">User can edit</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingComponent.isRequired}
                      onChange={(e) => setEditingComponent({...editingComponent, isRequired: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Required field</span>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingComponent(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  <X className="w-4 h-4 inline mr-1" />
                  Cancel
                </button>
                <button
                  onClick={saveComponent}
                  disabled={!editingComponent.code || !editingComponent.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4 inline mr-1" />
                  Save Component
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
