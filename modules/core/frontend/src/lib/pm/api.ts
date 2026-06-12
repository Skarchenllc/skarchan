// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://project-management-backend:8000';

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

  // PM Projects
  pm_projects: {
    list: (params?: { status?: string; priority?: string; project_manager?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.project_manager) queryParams.append('project_manager', params.project_manager);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/projects${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/projects/${id}`),
    create: (data: any) => fetchApi('/project-management/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/projects/${id}`, {
      method: 'DELETE',
    }),
  },
  pmProjects: {
    list: (params?: { status?: string; priority?: string; project_manager?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.project_manager) queryParams.append('project_manager', params.project_manager);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/projects${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/projects/${id}`),
    create: (data: any) => fetchApi('/project-management/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/projects/${id}`, {
      method: 'DELETE',
    }),
  },

  // PM Tasks
  pm_tasks: {
    list: (params?: { status?: string; priority?: string; project_id?: string; assigned_to?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/tasks${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/tasks/${id}`),
    create: (data: any) => fetchApi('/project-management/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/tasks/${id}`, {
      method: 'DELETE',
    }),
  },
  pmTasks: {
    list: (params?: { status?: string; priority?: string; project_id?: string; assigned_to?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/tasks${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/tasks/${id}`),
    create: (data: any) => fetchApi('/project-management/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/tasks/${id}`, {
      method: 'DELETE',
    }),
  },

  // PM Milestones
  pm_milestones: {
    list: (params?: { status?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/milestones${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/milestones/${id}`),
    create: (data: any) => fetchApi('/project-management/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/milestones/${id}`, {
      method: 'DELETE',
    }),
  },
  pmMilestones: {
    list: (params?: { status?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/milestones${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/milestones/${id}`),
    create: (data: any) => fetchApi('/project-management/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/milestones/${id}`, {
      method: 'DELETE',
    }),
  },

  // PM Resources
  pm_resources: {
    list: (params?: { status?: string; resource_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.resource_type) queryParams.append('resource_type', params.resource_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/resources${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/resources/${id}`),
    create: (data: any) => fetchApi('/project-management/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/resources/${id}`, {
      method: 'DELETE',
    }),
  },
  pmResources: {
    list: (params?: { status?: string; resource_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.resource_type) queryParams.append('resource_type', params.resource_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/resources${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/resources/${id}`),
    create: (data: any) => fetchApi('/project-management/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/resources/${id}`, {
      method: 'DELETE',
    }),
  },

  // Time Tracking
  time_tracking: {
    list: (params?: { task_id?: string; resource_id?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.task_id) queryParams.append('task_id', params.task_id);
      if (params?.resource_id) queryParams.append('resource_id', params.resource_id);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/time-tracking${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/time-tracking/${id}`),
    create: (data: any) => fetchApi('/project-management/time-tracking', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/time-tracking/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/time-tracking/${id}`, {
      method: 'DELETE',
    }),
  },
  timeTracking: {
    list: (params?: { task_id?: string; resource_id?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.task_id) queryParams.append('task_id', params.task_id);
      if (params?.resource_id) queryParams.append('resource_id', params.resource_id);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/time-tracking${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/time-tracking/${id}`),
    create: (data: any) => fetchApi('/project-management/time-tracking', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/time-tracking/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/time-tracking/${id}`, {
      method: 'DELETE',
    }),
  },

  // PM Budgets
  pm_budgets: {
    list: (params?: { status?: string; project_id?: string; fiscal_year?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/budgets${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/budgets/${id}`),
    create: (data: any) => fetchApi('/project-management/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/budgets/${id}`, {
      method: 'DELETE',
    }),
  },
  pmBudgets: {
    list: (params?: { status?: string; project_id?: string; fiscal_year?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/project-management/budgets${query}`);
    },
    get: (id: string) => fetchApi(`/project-management/budgets/${id}`),
    create: (data: any) => fetchApi('/project-management/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/project-management/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/project-management/budgets/${id}`, {
      method: 'DELETE',
    }),
  },
};
