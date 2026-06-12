// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://inventory-backend:8000';

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

  // Stock Items
  stock_items: {
    list: (params?: { status?: string; category?: string; warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-items${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-items/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-items/${id}`, {
      method: 'DELETE',
    }),
  },
  stockItems: {
    list: (params?: { status?: string; category?: string; warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-items${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-items/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-items/${id}`, {
      method: 'DELETE',
    }),
  },

  // Warehouses
  warehouses: {
    list: (params?: { status?: string; location?: string; warehouse_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.location) queryParams.append('location', params.location);
      if (params?.warehouse_type) queryParams.append('warehouse_type', params.warehouse_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/warehouses${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/warehouses/${id}`),
    create: (data: any) => fetchApi('/inventory/warehouses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/warehouses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/warehouses/${id}`, {
      method: 'DELETE',
    }),
  },

  // Stock Movements
  stock_movements: {
    list: (params?: { movement_type?: string; stock_item_id?: string; warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.movement_type) queryParams.append('movement_type', params.movement_type);
      if (params?.stock_item_id) queryParams.append('stock_item_id', params.stock_item_id);
      if (params?.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-movements${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-movements/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-movements/${id}`, {
      method: 'DELETE',
    }),
  },
  stockMovements: {
    list: (params?: { movement_type?: string; stock_item_id?: string; warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.movement_type) queryParams.append('movement_type', params.movement_type);
      if (params?.stock_item_id) queryParams.append('stock_item_id', params.stock_item_id);
      if (params?.warehouse_id) queryParams.append('warehouse_id', params.warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-movements${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-movements/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-movements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-movements/${id}`, {
      method: 'DELETE',
    }),
  },

  // Stock Adjustments
  stock_adjustments: {
    list: (params?: { adjustment_type?: string; stock_item_id?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.adjustment_type) queryParams.append('adjustment_type', params.adjustment_type);
      if (params?.stock_item_id) queryParams.append('stock_item_id', params.stock_item_id);
      if (params?.status) queryParams.append('status', params.status);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-adjustments${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-adjustments/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-adjustments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-adjustments/${id}`, {
      method: 'DELETE',
    }),
  },
  stockAdjustments: {
    list: (params?: { adjustment_type?: string; stock_item_id?: string; status?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.adjustment_type) queryParams.append('adjustment_type', params.adjustment_type);
      if (params?.stock_item_id) queryParams.append('stock_item_id', params.stock_item_id);
      if (params?.status) queryParams.append('status', params.status);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-adjustments${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-adjustments/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-adjustments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-adjustments/${id}`, {
      method: 'DELETE',
    }),
  },

  // Stock Transfers
  stock_transfers: {
    list: (params?: { status?: string; from_warehouse_id?: string; to_warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.from_warehouse_id) queryParams.append('from_warehouse_id', params.from_warehouse_id);
      if (params?.to_warehouse_id) queryParams.append('to_warehouse_id', params.to_warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-transfers${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-transfers/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-transfers/${id}`, {
      method: 'DELETE',
    }),
  },
  stockTransfers: {
    list: (params?: { status?: string; from_warehouse_id?: string; to_warehouse_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.from_warehouse_id) queryParams.append('from_warehouse_id', params.from_warehouse_id);
      if (params?.to_warehouse_id) queryParams.append('to_warehouse_id', params.to_warehouse_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/inventory/stock-transfers${query}`);
    },
    get: (id: string) => fetchApi(`/inventory/stock-transfers/${id}`),
    create: (data: any) => fetchApi('/inventory/stock-transfers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/inventory/stock-transfers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/inventory/stock-transfers/${id}`, {
      method: 'DELETE',
    }),
  },
};
