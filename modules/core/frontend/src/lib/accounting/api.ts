import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006';
const BASE_URL = API_URL === '/api' ? '/api/accounting' : `${API_URL}/api/v1`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Temporary user ID
const TEMP_USER_ID = '00000000-0000-0000-0000-000000000001';

export const api = {
  // Custom Fields API — canonical store served by core
  customFields: {
    listDefinitions: (params?: { entity_type?: string; is_visible?: boolean; skip?: number; limit?: number }) =>
      axios.get<any>('/api/v1/development/custom-fields/definitions', { params }),

    getDefinition: (id: string) =>
      axios.get<any>(`/api/v1/development/custom-fields/definitions/${id}`),

    createDefinition: (data: any) =>
      axios.post<any>('/api/v1/development/custom-fields/definitions', data),

    updateDefinition: (id: string, data: any) =>
      axios.put<any>(`/api/v1/development/custom-fields/definitions/${id}`, data),

    deleteDefinition: (id: string) =>
      axios.delete(`/api/v1/development/custom-fields/definitions/${id}`),
  },

  // Chart of Accounts API
  chart_of_accounts: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/chart-of-accounts', { params }),
    get: (id: string) => apiClient.get<any>(`/chart-of-accounts/${id}`),
    create: (data: any) => apiClient.post<any>('/chart-of-accounts', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/chart-of-accounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/chart-of-accounts/${id}`),
  },

  // GL Transactions API
  transactions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/transactions', { params }),
    get: (id: string) => apiClient.get<any>(`/transactions/${id}`),
    create: (data: any) => apiClient.post<any>('/transactions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/transactions/${id}`),
  },

  // Fixed Assets API
  fixed_assets: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/fixed-assets', { params }),
    get: (id: string) => apiClient.get<any>(`/fixed-assets/${id}`),
    create: (data: any) => apiClient.post<any>('/fixed-assets', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/fixed-assets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/fixed-assets/${id}`),
  },

  // Vendors API
  vendors: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/vendors', { params }),
    get: (id: string) => apiClient.get<any>(`/vendors/${id}`),
    create: (data: any) => apiClient.post<any>('/vendors', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/vendors/${id}`, data),
    delete: (id: string) => apiClient.delete(`/vendors/${id}`),
  },

  // Bank Accounts API
  bank_accounts: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bank-accounts', { params }),
    get: (id: string) => apiClient.get<any>(`/bank-accounts/${id}`),
    create: (data: any) => apiClient.post<any>('/bank-accounts', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bank-accounts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-accounts/${id}`),
  },

  // Bank Statements API
  bank_statements: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bank-statements', { params }),
    get: (id: string) => apiClient.get<any>(`/bank-statements/${id}`),
    create: (data: any) => apiClient.post<any>('/bank-statements', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bank-statements/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-statements/${id}`),
  },

  // Bank Statement Transactions API
  bank_statement_transactions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bank-statement-transactions', { params }),
    get: (id: string) => apiClient.get<any>(`/bank-statement-transactions/${id}`),
    create: (data: any) => apiClient.post<any>('/bank-statement-transactions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bank-statement-transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-statement-transactions/${id}`),
  },

  // Bank Reconciliations API
  bank_reconciliations: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bank-reconciliations', { params }),
    get: (id: string) => apiClient.get<any>(`/bank-reconciliations/${id}`),
    create: (data: any) => apiClient.post<any>('/bank-reconciliations', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bank-reconciliations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bank-reconciliations/${id}`),
  },

  // Reconciliation Items API
  reconciliation_items: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/reconciliation-items', { params }),
    get: (id: string) => apiClient.get<any>(`/reconciliation-items/${id}`),
    create: (data: any) => apiClient.post<any>('/reconciliation-items', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/reconciliation-items/${id}`, data),
    delete: (id: string) => apiClient.delete(`/reconciliation-items/${id}`),
  },

  // Time Entries API
  time_entries: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/time-entries', { params }),
    get: (id: string) => apiClient.get<any>(`/time-entries/${id}`),
    create: (data: any) => apiClient.post<any>('/time-entries', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/time-entries/${id}`, data),
    delete: (id: string) => apiClient.delete(`/time-entries/${id}`),
  },

  // Bills API
  bills: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bills', { params }),
    get: (id: string) => apiClient.get<any>(`/bills/${id}`),
    create: (data: any) => apiClient.post<any>('/bills', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bills/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bills/${id}`),
  },

  // Bill Payments API
  bill_payments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bill-payments', { params }),
    get: (id: string) => apiClient.get<any>(`/bill-payments/${id}`),
    create: (data: any) => apiClient.post<any>('/bill-payments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bill-payments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bill-payments/${id}`),
  },

  // Batch Payments API
  batch_payments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/batch-payments', { params }),
    get: (id: string) => apiClient.get<any>(`/batch-payments/${id}`),
    create: (data: any) => apiClient.post<any>('/batch-payments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/batch-payments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/batch-payments/${id}`),
  },

  // Budgets API
  budgets: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budgets', { params }),
    get: (id: string) => apiClient.get<any>(`/budgets/${id}`),
    create: (data: any) => apiClient.post<any>('/budgets', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budgets/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budgets/${id}`),
  },

  // Budget Lines API
  budget_lines: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budget-lines', { params }),
    get: (id: string) => apiClient.get<any>(`/budget-lines/${id}`),
    create: (data: any) => apiClient.post<any>('/budget-lines', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budget-lines/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-lines/${id}`),
  },

  // Budget Revisions API
  budget_revisions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budget-revisions', { params }),
    get: (id: string) => apiClient.get<any>(`/budget-revisions/${id}`),
    create: (data: any) => apiClient.post<any>('/budget-revisions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budget-revisions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-revisions/${id}`),
  },

  // Budget Alerts API
  budget_alerts: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budget-alerts', { params }),
    get: (id: string) => apiClient.get<any>(`/budget-alerts/${id}`),
    create: (data: any) => apiClient.post<any>('/budget-alerts', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budget-alerts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-alerts/${id}`),
  },

  // Budget Scenarios API
  budget_scenarios: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budget-scenarios', { params }),
    get: (id: string) => apiClient.get<any>(`/budget-scenarios/${id}`),
    create: (data: any) => apiClient.post<any>('/budget-scenarios', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budget-scenarios/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-scenarios/${id}`),
  },

  // Budget Templates API
  budget_templates: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/budget-templates', { params }),
    get: (id: string) => apiClient.get<any>(`/budget-templates/${id}`),
    create: (data: any) => apiClient.post<any>('/budget-templates', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/budget-templates/${id}`, data),
    delete: (id: string) => apiClient.delete(`/budget-templates/${id}`),
  },

  // Currencies API
  currencies: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/currencies', { params }),
    get: (id: string) => apiClient.get<any>(`/currencies/${id}`),
    create: (data: any) => apiClient.post<any>('/currencies', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/currencies/${id}`, data),
    delete: (id: string) => apiClient.delete(`/currencies/${id}`),
  },

  // Exchange Rates API
  exchange_rates: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/exchange-rates', { params }),
    get: (id: string) => apiClient.get<any>(`/exchange-rates/${id}`),
    create: (data: any) => apiClient.post<any>('/exchange-rates', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/exchange-rates/${id}`, data),
    delete: (id: string) => apiClient.delete(`/exchange-rates/${id}`),
  },

  // Currency Exchange Transactions API
  currency_exchange_transactions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/currency-exchange-transactions', { params }),
    get: (id: string) => apiClient.get<any>(`/currency-exchange-transactions/${id}`),
    create: (data: any) => apiClient.post<any>('/currency-exchange-transactions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/currency-exchange-transactions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/currency-exchange-transactions/${id}`),
  },

  // Unrealized Gain/Loss API
  unrealized_gain_loss: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/unrealized-gain-loss', { params }),
    get: (id: string) => apiClient.get<any>(`/unrealized-gain-loss/${id}`),
    create: (data: any) => apiClient.post<any>('/unrealized-gain-loss', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/unrealized-gain-loss/${id}`, data),
    delete: (id: string) => apiClient.delete(`/unrealized-gain-loss/${id}`),
  },

  // Accounting Customers API
  accounting_customers: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/accounting-customers', { params }),
    get: (id: string) => apiClient.get<any>(`/accounting-customers/${id}`),
    create: (data: any) => apiClient.post<any>('/accounting-customers', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/accounting-customers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/accounting-customers/${id}`),
  },

  // Invoices API
  invoices: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/invoices', { params }),
    get: (id: string) => apiClient.get<any>(`/invoices/${id}`),
    create: (data: any) => apiClient.post<any>('/invoices', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/invoices/${id}`, data),
    delete: (id: string) => apiClient.delete(`/invoices/${id}`),
  },

  // Invoice Payments API
  invoice_payments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/invoice-payments', { params }),
    get: (id: string) => apiClient.get<any>(`/invoice-payments/${id}`),
    create: (data: any) => apiClient.post<any>('/invoice-payments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/invoice-payments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/invoice-payments/${id}`),
  },

  // Payment Reminders API
  payment_reminders: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/payment-reminders', { params }),
    get: (id: string) => apiClient.get<any>(`/payment-reminders/${id}`),
    create: (data: any) => apiClient.post<any>('/payment-reminders', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/payment-reminders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payment-reminders/${id}`),
  },

  // Payroll Employees API
  payroll_employees: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/payroll-employees', { params }),
    get: (id: string) => apiClient.get<any>(`/payroll-employees/${id}`),
    create: (data: any) => apiClient.post<any>('/payroll-employees', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/payroll-employees/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll-employees/${id}`),
  },

  // Salary Structures API
  salary_structures: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/salary-structures', { params }),
    get: (id: string) => apiClient.get<any>(`/salary-structures/${id}`),
    create: (data: any) => apiClient.post<any>('/salary-structures', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/salary-structures/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salary-structures/${id}`),
  },

  // Tax Configurations API
  tax_configurations: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/tax-configurations', { params }),
    get: (id: string) => apiClient.get<any>(`/tax-configurations/${id}`),
    create: (data: any) => apiClient.post<any>('/tax-configurations', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/tax-configurations/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tax-configurations/${id}`),
  },

  // Payroll Runs API
  payroll_runs: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/payroll-runs', { params }),
    get: (id: string) => apiClient.get<any>(`/payroll-runs/${id}`),
    create: (data: any) => apiClient.post<any>('/payroll-runs', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/payroll-runs/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll-runs/${id}`),
  },

  // Payslips API
  payslips: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/payslips', { params }),
    get: (id: string) => apiClient.get<any>(`/payslips/${id}`),
    create: (data: any) => apiClient.post<any>('/payslips', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/payslips/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payslips/${id}`),
  },

  // Payroll Journals API
  payroll_journals: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/payroll-journals', { params }),
    get: (id: string) => apiClient.get<any>(`/payroll-journals/${id}`),
    create: (data: any) => apiClient.post<any>('/payroll-journals', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/payroll-journals/${id}`, data),
    delete: (id: string) => apiClient.delete(`/payroll-journals/${id}`),
  },

  // Purchase Orders API
  purchase_orders: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/purchase-orders', { params }),
    get: (id: string) => apiClient.get<any>(`/purchase-orders/${id}`),
    create: (data: any) => apiClient.post<any>('/purchase-orders', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/purchase-orders/${id}`, data),
    delete: (id: string) => apiClient.delete(`/purchase-orders/${id}`),
  },

  // PO Receipts API
  po_receipts: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/po-receipts', { params }),
    get: (id: string) => apiClient.get<any>(`/po-receipts/${id}`),
    create: (data: any) => apiClient.post<any>('/po-receipts', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/po-receipts/${id}`, data),
    delete: (id: string) => apiClient.delete(`/po-receipts/${id}`),
  },

  // Accounting Periods API
  accounting_periods: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/accounting-periods', { params }),
    get: (id: string) => apiClient.get<any>(`/accounting-periods/${id}`),
    create: (data: any) => apiClient.post<any>('/accounting-periods', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/accounting-periods/${id}`, data),
    delete: (id: string) => apiClient.delete(`/accounting-periods/${id}`),
  },

  // Period Closings API
  period_closings: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/period-closings', { params }),
    get: (id: string) => apiClient.get<any>(`/period-closings/${id}`),
    create: (data: any) => apiClient.post<any>('/period-closings', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/period-closings/${id}`, data),
    delete: (id: string) => apiClient.delete(`/period-closings/${id}`),
  },

  // Year-End Closings API
  year_end_closings: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/year-end-closings', { params }),
    get: (id: string) => apiClient.get<any>(`/year-end-closings/${id}`),
    create: (data: any) => apiClient.post<any>('/year-end-closings', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/year-end-closings/${id}`, data),
    delete: (id: string) => apiClient.delete(`/year-end-closings/${id}`),
  },

  // Period Adjustments API
  period_adjustments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/period-adjustments', { params }),
    get: (id: string) => apiClient.get<any>(`/period-adjustments/${id}`),
    create: (data: any) => apiClient.post<any>('/period-adjustments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/period-adjustments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/period-adjustments/${id}`),
  },

  // Tax Rates API
  tax_rates: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/tax-rates', { params }),
    get: (id: string) => apiClient.get<any>(`/tax-rates/${id}`),
    create: (data: any) => apiClient.post<any>('/tax-rates', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/tax-rates/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tax-rates/${id}`),
  },

  // Tax Settings API
  tax_settings: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/tax-settings', { params }),
    get: (id: string) => apiClient.get<any>(`/tax-settings/${id}`),
    create: (data: any) => apiClient.post<any>('/tax-settings', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/tax-settings/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tax-settings/${id}`),
  },

  // Tax Payments API
  tax_payments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/tax-payments', { params }),
    get: (id: string) => apiClient.get<any>(`/tax-payments/${id}`),
    create: (data: any) => apiClient.post<any>('/tax-payments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/tax-payments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/tax-payments/${id}`),
  },
};

export default api;
