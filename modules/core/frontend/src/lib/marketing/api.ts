import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8012';
const BASE_URL = API_URL === '/api' ? '/api/marketing' : `${API_URL}/api/v1`;

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

  // Leads API
  leads: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/leads', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/leads/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/leads', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/leads/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/leads/${id}`),
  },

  // Campaigns API
  campaigns: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/campaigns', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/campaigns/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/campaigns', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/campaigns/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/campaigns/${id}`),
  },

  // Content API
  contents: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/contents', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/contents/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/contents', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/contents/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/contents/${id}`),
  },

  // Campaign Activities API
  campaign_activities: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/campaign-activities', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/campaign-activities/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/campaign-activities', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/campaign-activities/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/campaign-activities/${id}`),
  },

  // Campaign Metrics API
  campaign_metrics: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/campaign-metrics', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/campaign-metrics/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/campaign-metrics', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/campaign-metrics/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/campaign-metrics/${id}`),
  },

  // Email Templates API
  marketing_email_templates: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/email-templates', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/email-templates/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/email-templates', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/email-templates/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/email-templates/${id}`),
  },

  // Lead Activities API
  lead_activities: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/lead-activities', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/lead-activities/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/lead-activities', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/lead-activities/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/lead-activities/${id}`),
  },

  // Website Analytics API
  website_analytics: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/website-analytics', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/website-analytics/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/website-analytics', {
        ...data,
        created_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/website-analytics/${id}`, data),

    delete: (id: string) =>
      apiClient.delete(`/website-analytics/${id}`),
  },
};

export default api;
