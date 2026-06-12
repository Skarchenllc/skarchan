// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://customer-service-backend:8000';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API fetch error:', error);
    throw error;
  }
}

// Helper function to extract arrays from wrapped API responses
export function extractArray<T>(data: any, key: string): T[] {
  try {
    if (!data) return [];

    // Check if data has the wrapped key
    if (data[key] && Array.isArray(data[key])) {
      return data[key];
    }

    // If data is already an array
    if (Array.isArray(data)) {
      return data;
    }

    return [];
  } catch (error) {
    console.error(`Error extracting array for key ${key}:`, error);
    return [];
  }
}

// Helper function to extract single object from wrapped API responses
export function extractObject<T>(data: any, key: string): T | null {
  try {
    if (!data) return null;

    // Check if data has the wrapped key
    if (data[key]) {
      return data[key];
    }

    // If data is already the object we want
    if (data.id) {
      return data;
    }

    return null;
  } catch (error) {
    console.error(`Error extracting object for key ${key}:`, error);
    return null;
  }
}

// API endpoints for each entity
export const api = {
  // Custom Fields API (for DynamicEntityForm)
  customFields: {
    listDefinitions: (params?: { entity_type?: string; is_visible?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.entity_type) queryParams.append('entity_type', params.entity_type);
      if (params?.is_visible !== undefined) queryParams.append('is_visible', String(params.is_visible));
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetch(`/api/v1/development/custom-fields/definitions${query}`).then(r => r.json()).then((d: any) => Array.isArray(d) ? d : (d.data || d));
    },
  },

  // Support Tickets
  support_tickets: {
    list: (params?: { status?: string; priority?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/support-tickets${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/support-tickets/${id}`),
    create: (data: any) => fetchApi('/customer-service/support-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/support-tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/support-tickets/${id}`, {
      method: 'DELETE',
    }),
  },
  supportTickets: {
    list: (params?: { status?: string; priority?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/support-tickets${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/support-tickets/${id}`),
    create: (data: any) => fetchApi('/customer-service/support-tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/support-tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/support-tickets/${id}`, {
      method: 'DELETE',
    }),
  },

  // Knowledge Base
  knowledge_base: {
    list: (params?: { category?: string; status?: string; article_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.article_type) queryParams.append('article_type', params.article_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/knowledge-base${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/knowledge-base/${id}`),
    create: (data: any) => fetchApi('/customer-service/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/knowledge-base/${id}`, {
      method: 'DELETE',
    }),
  },
  knowledgeBase: {
    list: (params?: { category?: string; status?: string; article_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append('category', params.category);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.article_type) queryParams.append('article_type', params.article_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/knowledge-base${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/knowledge-base/${id}`),
    create: (data: any) => fetchApi('/customer-service/knowledge-base', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/knowledge-base/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/knowledge-base/${id}`, {
      method: 'DELETE',
    }),
  },

  // Service Requests
  service_requests: {
    list: (params?: { status?: string; priority?: string; request_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.request_type) queryParams.append('request_type', params.request_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/service-requests${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/service-requests/${id}`),
    create: (data: any) => fetchApi('/customer-service/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/service-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/service-requests/${id}`, {
      method: 'DELETE',
    }),
  },
  serviceRequests: {
    list: (params?: { status?: string; priority?: string; request_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.request_type) queryParams.append('request_type', params.request_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/service-requests${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/service-requests/${id}`),
    create: (data: any) => fetchApi('/customer-service/service-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/service-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/service-requests/${id}`, {
      method: 'DELETE',
    }),
  },

  // Customer Feedback
  customer_feedback: {
    list: (params?: { feedback_type?: string; rating?: number; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.feedback_type) queryParams.append('feedback_type', params.feedback_type);
      if (params?.rating) queryParams.append('rating', String(params.rating));
      if (params?.status) queryParams.append('status', params.status);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/customer-feedback${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/customer-feedback/${id}`),
    create: (data: any) => fetchApi('/customer-service/customer-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/customer-feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/customer-feedback/${id}`, {
      method: 'DELETE',
    }),
  },
  customerFeedback: {
    list: (params?: { feedback_type?: string; rating?: number; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.feedback_type) queryParams.append('feedback_type', params.feedback_type);
      if (params?.rating) queryParams.append('rating', String(params.rating));
      if (params?.status) queryParams.append('status', params.status);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/customer-feedback${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/customer-feedback/${id}`),
    create: (data: any) => fetchApi('/customer-service/customer-feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/customer-feedback/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/customer-feedback/${id}`, {
      method: 'DELETE',
    }),
  },

  // SLA Agreements
  sla_agreements: {
    list: (params?: { status?: string; agreement_type?: string; priority_level?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.agreement_type) queryParams.append('agreement_type', params.agreement_type);
      if (params?.priority_level) queryParams.append('priority_level', params.priority_level);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/sla-agreements${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/sla-agreements/${id}`),
    create: (data: any) => fetchApi('/customer-service/sla-agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/sla-agreements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/sla-agreements/${id}`, {
      method: 'DELETE',
    }),
  },
  slaAgreements: {
    list: (params?: { status?: string; agreement_type?: string; priority_level?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.agreement_type) queryParams.append('agreement_type', params.agreement_type);
      if (params?.priority_level) queryParams.append('priority_level', params.priority_level);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/customer-service/sla-agreements${query}`);
    },
    get: (id: string) => fetchApi(`/customer-service/sla-agreements/${id}`),
    create: (data: any) => fetchApi('/customer-service/sla-agreements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/customer-service/sla-agreements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/customer-service/sla-agreements/${id}`, {
      method: 'DELETE',
    }),
  },
};
