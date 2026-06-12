// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://administration-backend:8000';

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

// API endpoints for each module
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

  // Executive Board
  executive_board: {
    list: () => fetchApi('/administration/executive-board'),
    get: (id: string) => fetchApi(`/administration/executive-board/${id}`),
    stats: () => fetchApi('/administration/executive-board/stats/overview'),
    create: (data: any) => fetchApi('/administration/executive-board', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/executive-board/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/executive-board/${id}`, {
      method: 'DELETE',
    }),
  },
  executiveBoard: {
    list: () => fetchApi('/administration/executive-board'),
    get: (id: string) => fetchApi(`/administration/executive-board/${id}`),
    stats: () => fetchApi('/administration/executive-board/stats/overview'),
    create: (data: any) => fetchApi('/administration/executive-board', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/executive-board/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/executive-board/${id}`, {
      method: 'DELETE',
    }),
  },

  // Legal Cases
  legal_cases: {
    list: (params?: { status?: string; case_type?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.case_type) queryParams.append('case_type', params.case_type);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/legal-cases${query}`);
    },
    get: (id: string) => fetchApi(`/administration/legal-cases/${id}`),
    create: (data: any) => fetchApi('/administration/legal-cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/legal-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/legal-cases/${id}`, {
      method: 'DELETE',
    }),
  },
  legalCases: {
    list: (params?: { status?: string; case_type?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.case_type) queryParams.append('case_type', params.case_type);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/legal-cases${query}`);
    },
    get: (id: string) => fetchApi(`/administration/legal-cases/${id}`),
    create: (data: any) => fetchApi('/administration/legal-cases', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/legal-cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/legal-cases/${id}`, {
      method: 'DELETE',
    }),
  },

  // Compliance Policies
  compliance_policies: {
    list: (params?: { status?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/compliance-policies${query}`);
    },
    get: (id: string) => fetchApi(`/administration/compliance-policies/${id}`),
    create: (data: any) => fetchApi('/administration/compliance-policies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/compliance-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/compliance-policies/${id}`, {
      method: 'DELETE',
    }),
  },
  compliancePolicies: {
    list: (params?: { status?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/compliance-policies${query}`);
    },
    get: (id: string) => fetchApi(`/administration/compliance-policies/${id}`),
    create: (data: any) => fetchApi('/administration/compliance-policies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/compliance-policies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/compliance-policies/${id}`, {
      method: 'DELETE',
    }),
  },

  // Compliance Audits
  compliance_audits: {
    list: (params?: { status?: string; audit_type?: string; risk_level?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.audit_type) queryParams.append('audit_type', params.audit_type);
      if (params?.risk_level) queryParams.append('risk_level', params.risk_level);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/compliance-audits${query}`);
    },
    get: (id: string) => fetchApi(`/administration/compliance-audits/${id}`),
    create: (data: any) => fetchApi('/administration/compliance-audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/compliance-audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/compliance-audits/${id}`, {
      method: 'DELETE',
    }),
  },
  complianceAudits: {
    list: (params?: { status?: string; audit_type?: string; risk_level?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.audit_type) queryParams.append('audit_type', params.audit_type);
      if (params?.risk_level) queryParams.append('risk_level', params.risk_level);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/compliance-audits${query}`);
    },
    get: (id: string) => fetchApi(`/administration/compliance-audits/${id}`),
    create: (data: any) => fetchApi('/administration/compliance-audits', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/compliance-audits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/compliance-audits/${id}`, {
      method: 'DELETE',
    }),
  },

  // Strategic Initiatives
  strategic_initiatives: {
    list: (params?: { status?: string; priority?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/strategic-initiatives${query}`);
    },
    get: (id: string) => fetchApi(`/administration/strategic-initiatives/${id}`),
    create: (data: any) => fetchApi('/administration/strategic-initiatives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/strategic-initiatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/strategic-initiatives/${id}`, {
      method: 'DELETE',
    }),
  },
  strategicInitiatives: {
    list: (params?: { status?: string; priority?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/administration/strategic-initiatives${query}`);
    },
    get: (id: string) => fetchApi(`/administration/strategic-initiatives/${id}`),
    create: (data: any) => fetchApi('/administration/strategic-initiatives', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/administration/strategic-initiatives/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/administration/strategic-initiatives/${id}`, {
      method: 'DELETE',
    }),
  },
};
