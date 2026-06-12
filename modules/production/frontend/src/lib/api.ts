// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://production-backend:8000';

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

  // Production Products
  production_products: {
    list: (params?: { status?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/production-products${query}`);
    },
    get: (id: string) => fetchApi(`/production/production-products/${id}`),
    create: (data: any) => fetchApi('/production/production-products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/production-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/production-products/${id}`, {
      method: 'DELETE',
    }),
  },
  productionProducts: {
    list: (params?: { status?: string; category?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/production-products${query}`);
    },
    get: (id: string) => fetchApi(`/production/production-products/${id}`),
    create: (data: any) => fetchApi('/production/production-products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/production-products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/production-products/${id}`, {
      method: 'DELETE',
    }),
  },

  // Inventory
  inventory: {
    list: (params?: { status?: string; warehouse_location?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.warehouse_location) queryParams.append('warehouse_location', params.warehouse_location);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/inventory${query}`);
    },
    get: (id: string) => fetchApi(`/production/inventory/${id}`),
    create: (data: any) => fetchApi('/production/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/inventory/${id}`, {
      method: 'DELETE',
    }),
  },

  // Bill of Materials
  bill_of_materials: {
    list: (params?: { status?: string; parent_product?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.parent_product) queryParams.append('parent_product', params.parent_product);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/bill-of-materials${query}`);
    },
    get: (id: string) => fetchApi(`/production/bill-of-materials/${id}`),
    create: (data: any) => fetchApi('/production/bill-of-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/bill-of-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/bill-of-materials/${id}`, {
      method: 'DELETE',
    }),
  },
  billOfMaterials: {
    list: (params?: { status?: string; parent_product?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.parent_product) queryParams.append('parent_product', params.parent_product);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/bill-of-materials${query}`);
    },
    get: (id: string) => fetchApi(`/production/bill-of-materials/${id}`),
    create: (data: any) => fetchApi('/production/bill-of-materials', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/bill-of-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/bill-of-materials/${id}`, {
      method: 'DELETE',
    }),
  },

  // Production Lines
  production_lines: {
    list: (params?: { status?: string; location?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.location) queryParams.append('location', params.location);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/production-lines${query}`);
    },
    get: (id: string) => fetchApi(`/production/production-lines/${id}`),
    create: (data: any) => fetchApi('/production/production-lines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/production-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/production-lines/${id}`, {
      method: 'DELETE',
    }),
  },
  productionLines: {
    list: (params?: { status?: string; location?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.location) queryParams.append('location', params.location);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/production-lines${query}`);
    },
    get: (id: string) => fetchApi(`/production/production-lines/${id}`),
    create: (data: any) => fetchApi('/production/production-lines', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/production-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/production-lines/${id}`, {
      method: 'DELETE',
    }),
  },

  // Work Orders
  work_orders: {
    list: (params?: { status?: string; priority?: string; production_line?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.production_line) queryParams.append('production_line', params.production_line);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/work-orders${query}`);
    },
    get: (id: string) => fetchApi(`/production/work-orders/${id}`),
    create: (data: any) => fetchApi('/production/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/work-orders/${id}`, {
      method: 'DELETE',
    }),
  },
  workOrders: {
    list: (params?: { status?: string; priority?: string; production_line?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.priority) queryParams.append('priority', params.priority);
      if (params?.production_line) queryParams.append('production_line', params.production_line);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/production/work-orders${query}`);
    },
    get: (id: string) => fetchApi(`/production/work-orders/${id}`),
    create: (data: any) => fetchApi('/production/work-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/production/work-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/production/work-orders/${id}`, {
      method: 'DELETE',
    }),
  },
};
