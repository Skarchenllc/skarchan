/**
 * Universal Module and Entity Configuration
 * Defines all modules and their entities for Custom Fields and Workflow Automation
 */

export interface EntityDefinition {
  value: string;
  label: string;
  module: string;
  description?: string;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  color: string; // For UI badges and visual identification
  entities: EntityDefinition[];
}

export const MODULE_ENTITIES: ModuleDefinition[] = [
  {
    id: 'contacts',
    name: 'Contacts',
    color: 'blue',
    entities: [
      { value: 'contacts', label: 'Contacts', module: 'contacts', description: 'People — central system-of-record, referenced by other modules' },
      { value: 'sales_accounts', label: 'Organizations', module: 'contacts', description: 'Organizations / companies — central record referenced by other modules' },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    color: 'green',
    entities: [
      { value: 'customers', label: 'Customers', module: 'sales', description: 'Active customers and their lifetime value' },
      { value: 'sales_products', label: 'Products', module: 'sales', description: 'Sales price book / product catalog' },
      { value: 'opportunities', label: 'Opportunities', module: 'sales', description: 'Sales pipeline opportunities' },
      { value: 'quotes', label: 'Quotes', module: 'sales', description: 'Price quotations and proposals' },
      { value: 'orders', label: 'Orders', module: 'sales', description: 'Sales orders and transactions' },
      { value: 'activities', label: 'Activities', module: 'sales', description: 'Calls, meetings, tasks and notes' },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    color: 'purple',
    entities: [
      { value: 'forms', label: 'Capture Forms', module: 'marketing', description: 'Inbound lead-capture forms' },
      { value: 'form_submissions', label: 'Form Submissions', module: 'marketing', description: 'Raw inbound submissions' },
      { value: 'leads', label: 'Leads', module: 'marketing', description: 'Marketing qualified leads' },
      { value: 'lead_activities', label: 'Lead Activities', module: 'marketing', description: 'Lead engagement events' },
      { value: 'scoring_rules', label: 'Scoring Rules', module: 'marketing', description: 'Event → points lead-scoring rules' },
      { value: 'lead_score_events', label: 'Score Events', module: 'marketing', description: 'Lead scoring audit log' },
      { value: 'campaigns', label: 'Campaigns', module: 'marketing', description: 'Marketing campaigns' },
      { value: 'campaign_activities', label: 'Campaign Activities', module: 'marketing', description: 'Campaign execution log' },
      { value: 'campaign_metrics', label: 'Campaign Metrics', module: 'marketing', description: 'Campaign performance metrics' },
      { value: 'contents', label: 'Content', module: 'marketing', description: 'Marketing content and assets' },
      { value: 'segments', label: 'Segments', module: 'marketing', description: 'Audience segments' },
      { value: 'lists', label: 'Lists', module: 'marketing', description: 'Contact / lead lists' },
      { value: 'journeys', label: 'Journeys', module: 'marketing', description: 'Drip / nurture sequences' },
      { value: 'journey_enrollments', label: 'Journey Enrollments', module: 'marketing', description: 'Subjects moving through journeys' },
      { value: 'marketing_email_templates', label: 'Email Templates', module: 'marketing', description: 'Email marketing templates' },
      { value: 'email_sends', label: 'Email Sends', module: 'marketing', description: 'Outbound email delivery log' },
      { value: 'website_analytics', label: 'Web Analytics', module: 'marketing', description: 'Website analytics metrics' },
    ],
  },
  {
    id: 'automation',
    name: 'Automation',
    color: 'purple',
    entities: [
      { value: 'automations', label: 'Automation Rules', module: 'automation', description: 'Trigger → condition → action rules' },
      { value: 'automation_runs', label: 'Run History', module: 'automation', description: 'Automation execution audit log' },
    ],
  },
  {
    id: 'hr',
    name: 'Human Resources',
    color: 'orange',
    entities: [
      { value: 'employee', label: 'Employees', module: 'hr', description: 'Employee records' },
      { value: 'candidate', label: 'Candidates', module: 'hr', description: 'Job candidates and applicants' },
      { value: 'job_posting', label: 'Job Postings', module: 'hr', description: 'Open positions and job listings' },
      { value: 'performance_review', label: 'Performance Reviews', module: 'hr', description: 'Employee performance evaluations' },
      { value: 'training', label: 'Training', module: 'hr', description: 'Training programs and sessions' },
      { value: 'timesheet', label: 'Timesheets', module: 'hr', description: 'Employee time tracking' },
      { value: 'leave_request', label: 'Leave Requests', module: 'hr', description: 'Time off requests' },
    ],
  },
  {
    id: 'accounting',
    name: 'Accounting & Finance',
    color: 'red',
    entities: [
      { value: 'account_ledger', label: 'Accounts', module: 'accounting', description: 'Chart of accounts and ledgers' },
      { value: 'transaction', label: 'Transactions', module: 'accounting', description: 'Financial transactions' },
      { value: 'journal_entry', label: 'Journal Entries', module: 'accounting', description: 'Accounting journal entries' },
      { value: 'budget', label: 'Budgets', module: 'accounting', description: 'Financial budgets' },
      { value: 'expense', label: 'Expenses', module: 'accounting', description: 'Business expenses' },
      { value: 'fixed_asset', label: 'Fixed Assets', module: 'accounting', description: 'Company fixed assets' },
      { value: 'payable', label: 'Accounts Payable', module: 'accounting', description: 'Vendor payables' },
      { value: 'receivable', label: 'Accounts Receivable', module: 'accounting', description: 'Customer receivables' },
      { value: 'payment', label: 'Payments', module: 'accounting', description: 'Payment records' },
    ],
  },
  {
    id: 'production',
    name: 'Production',
    color: 'yellow',
    entities: [
      { value: 'product', label: 'Products', module: 'production', description: 'Product catalog' },
      { value: 'work_order', label: 'Work Orders', module: 'production', description: 'Manufacturing work orders' },
      { value: 'bom', label: 'Bill of Materials', module: 'production', description: 'Product BOMs' },
      { value: 'production_line', label: 'Production Lines', module: 'production', description: 'Manufacturing lines' },
      { value: 'inventory', label: 'Inventory', module: 'production', description: 'Inventory items' },
      { value: 'quality_check', label: 'Quality Checks', module: 'production', description: 'Quality control inspections' },
      { value: 'equipment', label: 'Equipment', module: 'production', description: 'Production equipment and machinery' },
    ],
  },
  {
    id: 'rd',
    name: 'Research & Development',
    color: 'indigo',
    entities: [
      { value: 'project', label: 'Projects', module: 'rd', description: 'R&D projects' },
      { value: 'experiment', label: 'Experiments', module: 'rd', description: 'Research experiments' },
      { value: 'patent', label: 'Patents', module: 'rd', description: 'Patent applications and grants' },
      { value: 'research_paper', label: 'Research Papers', module: 'rd', description: 'Research publications' },
      { value: 'prototype', label: 'Prototypes', module: 'rd', description: 'Product prototypes' },
      { value: 'test_result', label: 'Test Results', module: 'rd', description: 'Experiment and test results' },
    ],
  },
  {
    id: 'administration',
    name: 'Administration',
    color: 'gray',
    entities: [
      { value: 'department', label: 'Departments', module: 'administration', description: 'Company departments' },
      { value: 'location', label: 'Locations', module: 'administration', description: 'Company locations and facilities' },
      { value: 'vendor', label: 'Vendors', module: 'administration', description: 'Vendor and supplier records' },
      { value: 'document', label: 'Documents', module: 'administration', description: 'Company documents' },
      { value: 'policy', label: 'Policies', module: 'administration', description: 'Company policies and procedures' },
      { value: 'meeting', label: 'Meetings', module: 'administration', description: 'Company meetings' },
    ],
  },
];

// Helper functions
export const getAllEntities = (): EntityDefinition[] => {
  return MODULE_ENTITIES.flatMap(module => module.entities);
};

export const getEntitiesByModule = (moduleId: string): EntityDefinition[] => {
  const module = MODULE_ENTITIES.find(m => m.id === moduleId);
  return module ? module.entities : [];
};

export const getModuleByEntityValue = (entityValue: string): ModuleDefinition | undefined => {
  return MODULE_ENTITIES.find(module =>
    module.entities.some(entity => entity.value === entityValue)
  );
};

export const getEntityByValue = (entityValue: string): EntityDefinition | undefined => {
  return getAllEntities().find(entity => entity.value === entityValue);
};

// Color mapping for UI badges
export const MODULE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  contacts: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  sales: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  marketing: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  hr: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  accounting: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  production: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  rd: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  administration: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
};

// Entity type badge colors
export const ENTITY_BADGE_COLORS: Record<string, string> = {
  // CRM
  account: 'bg-blue-100 text-blue-800',
  contact: 'bg-pink-100 text-pink-800',
  opportunity: 'bg-yellow-100 text-yellow-800',
  case: 'bg-red-100 text-red-800',
  activity: 'bg-green-100 text-green-800',
  lead: 'bg-purple-100 text-purple-800',

  // Sales
  customer: 'bg-green-100 text-green-800',
  quote: 'bg-blue-100 text-blue-800',
  order: 'bg-indigo-100 text-indigo-800',
  sales_opportunity: 'bg-yellow-100 text-yellow-800',
  contract: 'bg-purple-100 text-purple-800',
  invoice: 'bg-red-100 text-red-800',

  // Marketing
  campaign: 'bg-purple-100 text-purple-800',
  marketing_lead: 'bg-pink-100 text-pink-800',
  content: 'bg-indigo-100 text-indigo-800',
  email_template: 'bg-blue-100 text-blue-800',
  landing_page: 'bg-green-100 text-green-800',
  event: 'bg-yellow-100 text-yellow-800',

  // HR
  employee: 'bg-orange-100 text-orange-800',
  candidate: 'bg-yellow-100 text-yellow-800',
  job_posting: 'bg-green-100 text-green-800',
  performance_review: 'bg-blue-100 text-blue-800',
  training: 'bg-purple-100 text-purple-800',
  timesheet: 'bg-indigo-100 text-indigo-800',
  leave_request: 'bg-pink-100 text-pink-800',

  // Accounting
  account_ledger: 'bg-red-100 text-red-800',
  transaction: 'bg-orange-100 text-orange-800',
  journal_entry: 'bg-yellow-100 text-yellow-800',
  budget: 'bg-green-100 text-green-800',
  expense: 'bg-blue-100 text-blue-800',
  fixed_asset: 'bg-indigo-100 text-indigo-800',
  payable: 'bg-purple-100 text-purple-800',
  receivable: 'bg-pink-100 text-pink-800',
  payment: 'bg-red-100 text-red-800',

  // Production
  product: 'bg-yellow-100 text-yellow-800',
  work_order: 'bg-orange-100 text-orange-800',
  bom: 'bg-green-100 text-green-800',
  production_line: 'bg-blue-100 text-blue-800',
  inventory: 'bg-indigo-100 text-indigo-800',
  quality_check: 'bg-purple-100 text-purple-800',
  equipment: 'bg-pink-100 text-pink-800',

  // R&D
  project: 'bg-indigo-100 text-indigo-800',
  experiment: 'bg-purple-100 text-purple-800',
  patent: 'bg-blue-100 text-blue-800',
  research_paper: 'bg-green-100 text-green-800',
  prototype: 'bg-yellow-100 text-yellow-800',
  test_result: 'bg-orange-100 text-orange-800',

  // Administration
  department: 'bg-gray-100 text-gray-800',
  location: 'bg-blue-100 text-blue-800',
  vendor: 'bg-green-100 text-green-800',
  document: 'bg-yellow-100 text-yellow-800',
  policy: 'bg-purple-100 text-purple-800',
  meeting: 'bg-pink-100 text-pink-800',
};
