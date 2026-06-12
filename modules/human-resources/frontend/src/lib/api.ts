import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8005';
const BASE_URL = API_URL === '/api' ? '/api/v1/hr' : `${API_URL}/api/v1`;

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
  // Custom Fields API
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

  // Employees API
  employees: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/employees', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/employees/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/employees', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/employees/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/employees/${id}`),
  },

  // Attendance API
  attendance: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/attendance', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/attendance/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/attendance', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/attendance/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/attendance/${id}`),
  },

  // Time Off API
  time_off: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/time-off', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/time-off/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/time-off', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/time-off/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/time-off/${id}`),
  },

  // Performance Reviews API
  performance_reviews: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/performance-reviews', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/performance-reviews/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/performance-reviews', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/performance-reviews/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/performance-reviews/${id}`),
  },

  // Recruitment API
  recruitment: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/recruitment', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/recruitment/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/recruitment', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/recruitment/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/recruitment/${id}`),
  },

  // Training API
  training: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/training', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/training/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/training', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/training/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/training/${id}`),
  },

  // Departments API
  departments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/departments', { params }),
    get: (id: string) => apiClient.get<any>(`/departments/${id}`),
    create: (data: any) => apiClient.post<any>('/departments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/departments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/departments/${id}`),
  },

  // Positions API
  positions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/positions', { params }),
    get: (id: string) => apiClient.get<any>(`/positions/${id}`),
    create: (data: any) => apiClient.post<any>('/positions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/positions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/positions/${id}`),
  },

  // Leave Balances API
  leave_balances: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/leave-balances', { params }),
    get: (id: string) => apiClient.get<any>(`/leave-balances/${id}`),
    create: (data: any) => apiClient.post<any>('/leave-balances', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/leave-balances/${id}`, data),
    delete: (id: string) => apiClient.delete(`/leave-balances/${id}`),
  },

  // Benefits Plans API
  benefits_plans: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/benefits-plans', { params }),
    get: (id: string) => apiClient.get<any>(`/benefits-plans/${id}`),
    create: (data: any) => apiClient.post<any>('/benefits-plans', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/benefits-plans/${id}`, data),
    delete: (id: string) => apiClient.delete(`/benefits-plans/${id}`),
  },

  // Employee Benefits API
  employee_benefits: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/employee-benefits', { params }),
    get: (id: string) => apiClient.get<any>(`/employee-benefits/${id}`),
    create: (data: any) => apiClient.post<any>('/employee-benefits', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/employee-benefits/${id}`, data),
    delete: (id: string) => apiClient.delete(`/employee-benefits/${id}`),
  },

  // Bonuses API
  bonuses: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/bonuses', { params }),
    get: (id: string) => apiClient.get<any>(`/bonuses/${id}`),
    create: (data: any) => apiClient.post<any>('/bonuses', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/bonuses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/bonuses/${id}`),
  },

  // Salary Adjustments API
  salary_adjustments: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/salary-adjustments', { params }),
    get: (id: string) => apiClient.get<any>(`/salary-adjustments/${id}`),
    create: (data: any) => apiClient.post<any>('/salary-adjustments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/salary-adjustments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salary-adjustments/${id}`),
  },

  // Job Requisitions API
  job_requisitions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/recruitment/job-requisitions', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/job-requisitions/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/job-requisitions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/job-requisitions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/job-requisitions/${id}`),
  },

  // Applicants API
  applicants: {
    list: (params?: { skip?: number; limit?: number; job_requisition_id?: string; status?: string }) =>
      apiClient.get<any[]>('/recruitment/applicants', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/applicants/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/applicants', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/applicants/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/applicants/${id}`),
    updateStatus: (id: string, status: string) =>
      apiClient.patch<any>(`/recruitment/applicants/${id}/status`, { status }),
  },

  // Interviews API
  interviews: {
    list: (params?: { skip?: number; limit?: number; applicant_id?: string; job_id?: string; status?: string }) =>
      apiClient.get<any[]>('/recruitment/interviews', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/interviews/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/interviews', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/interviews/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/interviews/${id}`),
  },

  // Job Advertisements API
  advertisements: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/recruitment/advertisements', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/advertisements/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/advertisements', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/advertisements/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/advertisements/${id}`),
  },

  // Candidate Assessments API
  assessments: {
    list: (params?: { skip?: number; limit?: number; applicant_id?: string; job_id?: string }) =>
      apiClient.get<any[]>('/recruitment/assessments', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/assessments/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/assessments', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/assessments/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/assessments/${id}`),
  },

  // Background Checks API
  background_checks: {
    list: (params?: { skip?: number; limit?: number; applicant_id?: string; job_id?: string }) =>
      apiClient.get<any[]>('/recruitment/background-checks', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/background-checks/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/background-checks', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/background-checks/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/background-checks/${id}`),
  },

  // Sales Commissions API
  commissions: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/commissions', { params }),
    get: (id: string) => apiClient.get<any>(`/commissions/${id}`),
    create: (data: any) => apiClient.post<any>('/commissions', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/commissions/${id}`, data),
    delete: (id: string) => apiClient.delete(`/commissions/${id}`),
  },

  // Employee Portal Access API
  employee_credentials: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/employee-credentials', { params }),
    get: (id: string) => apiClient.get<any>(`/employee-credentials/${id}`),
    create: (data: any) => apiClient.post<any>('/employee-credentials', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/employee-credentials/${id}`, data),
    delete: (id: string) => apiClient.delete(`/employee-credentials/${id}`),
  },

  // Job Offers API
  job_offers: {
    list: (params?: { skip?: number; limit?: number; applicant_id?: string; job_id?: string }) =>
      apiClient.get<any[]>('/recruitment/job-offers', { params }),
    get: (id: string) => apiClient.get<any>(`/recruitment/job-offers/${id}`),
    create: (data: any) => apiClient.post<any>('/recruitment/job-offers', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/recruitment/job-offers/${id}`, data),
    delete: (id: string) => apiClient.delete(`/recruitment/job-offers/${id}`),
  },

  // Leave Requests API
  leave_requests: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/leave-requests', { params }),
    get: (id: string) => apiClient.get<any>(`/leave-requests/${id}`),
    create: (data: any) => apiClient.post<any>('/leave-requests', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/leave-requests/${id}`, data),
    delete: (id: string) => apiClient.delete(`/leave-requests/${id}`),
  },

  // Pay Grades API
  pay_grades: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/pay-grades', { params }),
    get: (id: string) => apiClient.get<any>(`/pay-grades/${id}`),
    create: (data: any) => apiClient.post<any>('/pay-grades', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/pay-grades/${id}`, data),
    delete: (id: string) => apiClient.delete(`/pay-grades/${id}`),
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

  // Salary Bands API
  salary_bands: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/salary-bands', { params }),
    get: (id: string) => apiClient.get<any>(`/salary-bands/${id}`),
    create: (data: any) => apiClient.post<any>('/salary-bands', { ...data, created_by: TEMP_USER_ID }),
    update: (id: string, data: any) => apiClient.put<any>(`/salary-bands/${id}`, data),
    delete: (id: string) => apiClient.delete(`/salary-bands/${id}`),
  },
};

export default api;
