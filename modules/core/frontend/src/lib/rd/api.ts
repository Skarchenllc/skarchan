// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://rd-backend:8000';

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

  // R&D Projects
  rd_projects: {
    list: (params?: { status?: string; research_area?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.research_area) queryParams.append('research_area', params.research_area);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/projects${query}`);
    },
    get: (id: string) => fetchApi(`/rd/projects/${id}`),
    create: (data: any) => fetchApi('/rd/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/projects/${id}`, {
      method: 'DELETE',
    }),
  },
  rdProjects: {
    list: (params?: { status?: string; research_area?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.research_area) queryParams.append('research_area', params.research_area);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/projects${query}`);
    },
    get: (id: string) => fetchApi(`/rd/projects/${id}`),
    create: (data: any) => fetchApi('/rd/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/projects/${id}`, {
      method: 'DELETE',
    }),
  },

  // Experiments
  experiments: {
    list: (params?: { status?: string; experiment_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.experiment_type) queryParams.append('experiment_type', params.experiment_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/experiments${query}`);
    },
    get: (id: string) => fetchApi(`/rd/experiments/${id}`),
    create: (data: any) => fetchApi('/rd/experiments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/experiments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/experiments/${id}`, {
      method: 'DELETE',
    }),
  },

  // Prototypes
  prototypes: {
    list: (params?: { status?: string; project_id?: string; prototype_version?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.prototype_version) queryParams.append('prototype_version', params.prototype_version);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/prototypes${query}`);
    },
    get: (id: string) => fetchApi(`/rd/prototypes/${id}`),
    create: (data: any) => fetchApi('/rd/prototypes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/prototypes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/prototypes/${id}`, {
      method: 'DELETE',
    }),
  },

  // Research Papers
  research_papers: {
    list: (params?: { status?: string; publication_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.publication_type) queryParams.append('publication_type', params.publication_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/research-papers${query}`);
    },
    get: (id: string) => fetchApi(`/rd/research-papers/${id}`),
    create: (data: any) => fetchApi('/rd/research-papers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/research-papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/research-papers/${id}`, {
      method: 'DELETE',
    }),
  },
  researchPapers: {
    list: (params?: { status?: string; publication_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.publication_type) queryParams.append('publication_type', params.publication_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/research-papers${query}`);
    },
    get: (id: string) => fetchApi(`/rd/research-papers/${id}`),
    create: (data: any) => fetchApi('/rd/research-papers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/research-papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/research-papers/${id}`, {
      method: 'DELETE',
    }),
  },

  // Patents
  patents: {
    list: (params?: { status?: string; patent_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.patent_type) queryParams.append('patent_type', params.patent_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/patents${query}`);
    },
    get: (id: string) => fetchApi(`/rd/patents/${id}`),
    create: (data: any) => fetchApi('/rd/patents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/patents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/patents/${id}`, {
      method: 'DELETE',
    }),
  },

  // Lab Equipment
  lab_equipment: {
    list: (params?: { status?: string; equipment_type?: string; location?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.equipment_type) queryParams.append('equipment_type', params.equipment_type);
      if (params?.location) queryParams.append('location', params.location);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/lab-equipment${query}`);
    },
    get: (id: string) => fetchApi(`/rd/lab-equipment/${id}`),
    create: (data: any) => fetchApi('/rd/lab-equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/lab-equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/lab-equipment/${id}`, {
      method: 'DELETE',
    }),
  },
  labEquipment: {
    list: (params?: { status?: string; equipment_type?: string; location?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.equipment_type) queryParams.append('equipment_type', params.equipment_type);
      if (params?.location) queryParams.append('location', params.location);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/lab-equipment${query}`);
    },
    get: (id: string) => fetchApi(`/rd/lab-equipment/${id}`),
    create: (data: any) => fetchApi('/rd/lab-equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/lab-equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/lab-equipment/${id}`, {
      method: 'DELETE',
    }),
  },

  // Research Team Members
  research_team_members: {
    list: (params?: { status?: string; role?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/team-members${query}`);
    },
    get: (id: string) => fetchApi(`/rd/team-members/${id}`),
    create: (data: any) => fetchApi('/rd/team-members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/team-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/team-members/${id}`, {
      method: 'DELETE',
    }),
  },
  researchTeamMembers: {
    list: (params?: { status?: string; role?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/team-members${query}`);
    },
    get: (id: string) => fetchApi(`/rd/team-members/${id}`),
    create: (data: any) => fetchApi('/rd/team-members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/team-members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/team-members/${id}`, {
      method: 'DELETE',
    }),
  },

  // R&D Milestones
  rd_milestones: {
    list: (params?: { status?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/milestones${query}`);
    },
    get: (id: string) => fetchApi(`/rd/milestones/${id}`),
    create: (data: any) => fetchApi('/rd/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/milestones/${id}`, {
      method: 'DELETE',
    }),
  },
  rdMilestones: {
    list: (params?: { status?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/milestones${query}`);
    },
    get: (id: string) => fetchApi(`/rd/milestones/${id}`),
    create: (data: any) => fetchApi('/rd/milestones', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/milestones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/milestones/${id}`, {
      method: 'DELETE',
    }),
  },

  // R&D Budgets
  rd_budgets: {
    list: (params?: { status?: string; project_id?: string; fiscal_year?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/budgets${query}`);
    },
    get: (id: string) => fetchApi(`/rd/budgets/${id}`),
    create: (data: any) => fetchApi('/rd/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/budgets/${id}`, {
      method: 'DELETE',
    }),
  },
  rdBudgets: {
    list: (params?: { status?: string; project_id?: string; fiscal_year?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      if (params?.fiscal_year) queryParams.append('fiscal_year', params.fiscal_year);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/budgets${query}`);
    },
    get: (id: string) => fetchApi(`/rd/budgets/${id}`),
    create: (data: any) => fetchApi('/rd/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/budgets/${id}`, {
      method: 'DELETE',
    }),
  },

  // R&D Collaborations
  rd_collaborations: {
    list: (params?: { status?: string; collaboration_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.collaboration_type) queryParams.append('collaboration_type', params.collaboration_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/collaborations${query}`);
    },
    get: (id: string) => fetchApi(`/rd/collaborations/${id}`),
    create: (data: any) => fetchApi('/rd/collaborations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/collaborations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/collaborations/${id}`, {
      method: 'DELETE',
    }),
  },
  rdCollaborations: {
    list: (params?: { status?: string; collaboration_type?: string; project_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.collaboration_type) queryParams.append('collaboration_type', params.collaboration_type);
      if (params?.project_id) queryParams.append('project_id', params.project_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/rd/collaborations${query}`);
    },
    get: (id: string) => fetchApi(`/rd/collaborations/${id}`),
    create: (data: any) => fetchApi('/rd/collaborations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/rd/collaborations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/rd/collaborations/${id}`, {
      method: 'DELETE',
    }),
  },
};
