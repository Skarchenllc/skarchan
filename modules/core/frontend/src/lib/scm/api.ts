// API utility functions with proper error handling and data extraction

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://scm-backend:8000';

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

  // Suppliers
  suppliers: {
    list: (params?: { status?: string; supplier_type?: string; rating?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier_type) queryParams.append('supplier_type', params.supplier_type);
      if (params?.rating) queryParams.append('rating', params.rating);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/suppliers${query}`);
    },
    get: (id: string) => fetchApi(`/scm/suppliers/${id}`),
    create: (data: any) => fetchApi('/scm/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/suppliers/${id}`, {
      method: 'DELETE',
    }),
  },

  // Purchase Orders
  purchase_orders: {
    list: (params?: { status?: string; supplier_id?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/purchase-orders${query}`);
    },
    get: (id: string) => fetchApi(`/scm/purchase-orders/${id}`),
    create: (data: any) => fetchApi('/scm/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/purchase-orders/${id}`, {
      method: 'DELETE',
    }),
  },
  purchaseOrders: {
    list: (params?: { status?: string; supplier_id?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/purchase-orders${query}`);
    },
    get: (id: string) => fetchApi(`/scm/purchase-orders/${id}`),
    create: (data: any) => fetchApi('/scm/purchase-orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/purchase-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/purchase-orders/${id}`, {
      method: 'DELETE',
    }),
  },

  // Purchase Requisitions
  purchase_requisitions: {
    list: (params?: { status?: string; requisition_type?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.requisition_type) queryParams.append('requisition_type', params.requisition_type);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/purchase-requisitions${query}`);
    },
    get: (id: string) => fetchApi(`/scm/purchase-requisitions/${id}`),
    create: (data: any) => fetchApi('/scm/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/purchase-requisitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/purchase-requisitions/${id}`, {
      method: 'DELETE',
    }),
  },
  purchaseRequisitions: {
    list: (params?: { status?: string; requisition_type?: string; priority?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.requisition_type) queryParams.append('requisition_type', params.requisition_type);
      if (params?.priority) queryParams.append('priority', params.priority);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/purchase-requisitions${query}`);
    },
    get: (id: string) => fetchApi(`/scm/purchase-requisitions/${id}`),
    create: (data: any) => fetchApi('/scm/purchase-requisitions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/purchase-requisitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/purchase-requisitions/${id}`, {
      method: 'DELETE',
    }),
  },

  // RFQ (Request for Quotation)
  rfq: {
    list: (params?: { status?: string; rfq_type?: string; supplier_id?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.rfq_type) queryParams.append('rfq_type', params.rfq_type);
      if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/rfq${query}`);
    },
    get: (id: string) => fetchApi(`/scm/rfq/${id}`),
    create: (data: any) => fetchApi('/scm/rfq', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/rfq/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/rfq/${id}`, {
      method: 'DELETE',
    }),
  },

  // Supplier Contracts
  supplier_contracts: {
    list: (params?: { status?: string; supplier_id?: string; contract_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      if (params?.contract_type) queryParams.append('contract_type', params.contract_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/supplier-contracts${query}`);
    },
    get: (id: string) => fetchApi(`/scm/supplier-contracts/${id}`),
    create: (data: any) => fetchApi('/scm/supplier-contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/supplier-contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/supplier-contracts/${id}`, {
      method: 'DELETE',
    }),
  },
  supplierContracts: {
    list: (params?: { status?: string; supplier_id?: string; contract_type?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.supplier_id) queryParams.append('supplier_id', params.supplier_id);
      if (params?.contract_type) queryParams.append('contract_type', params.contract_type);
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return fetchApi(`/scm/supplier-contracts${query}`);
    },
    get: (id: string) => fetchApi(`/scm/supplier-contracts/${id}`),
    create: (data: any) => fetchApi('/scm/supplier-contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: string, data: any) => fetchApi(`/scm/supplier-contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: string) => fetchApi(`/scm/supplier-contracts/${id}`, {
      method: 'DELETE',
    }),
  },
};
