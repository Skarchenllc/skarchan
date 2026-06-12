import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8012';
const BASE_URL = API_URL === '/api' ? '/api/sales' : `${API_URL}/api/v1`;

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

  // Customers API
  customers: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/customers', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/customers/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/customers', {
        ...data,
        owner_id: TEMP_USER_ID,
        created_by: TEMP_USER_ID,
        last_modified_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/customers/${id}`, {
        ...data,
        last_modified_by: TEMP_USER_ID,
      }),

    delete: (id: string) =>
      apiClient.delete(`/customers/${id}`),
  },

  // Opportunities API
  opportunities: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/opportunities', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/opportunities/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/opportunities', {
        ...data,
        owner_id: TEMP_USER_ID,
        created_by: TEMP_USER_ID,
        last_modified_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/opportunities/${id}`, {
        ...data,
        last_modified_by: TEMP_USER_ID,
      }),

    delete: (id: string) =>
      apiClient.delete(`/opportunities/${id}`),
  },

  // Quotes API
  quotes: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/quotes', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/quotes/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/quotes', {
        ...data,
        owner_id: TEMP_USER_ID,
        created_by: TEMP_USER_ID,
        last_modified_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/quotes/${id}`, {
        ...data,
        last_modified_by: TEMP_USER_ID,
      }),

    delete: (id: string) =>
      apiClient.delete(`/quotes/${id}`),
  },

  // Orders API
  orders: {
    list: (params?: { skip?: number; limit?: number }) =>
      apiClient.get<any[]>('/orders', { params }),

    get: (id: string) =>
      apiClient.get<any>(`/orders/${id}`),

    create: (data: any) =>
      apiClient.post<any>('/orders', {
        ...data,
        owner_id: TEMP_USER_ID,
        created_by: TEMP_USER_ID,
        last_modified_by: TEMP_USER_ID,
      }),

    update: (id: string, data: any) =>
      apiClient.put<any>(`/orders/${id}`, {
        ...data,
        last_modified_by: TEMP_USER_ID,
      }),

    delete: (id: string) =>
      apiClient.delete(`/orders/${id}`),
  },
};

export default api;
