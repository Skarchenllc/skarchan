import axios from 'axios';

// Use relative path /api when in browser, direct URL when in server-side
const API_URL = typeof window !== 'undefined'
  ? '/api'  // Browser: use relative path (goes through nginx)
  : process.env.NEXT_PUBLIC_API_URL || 'http://core-backend:8000/api';  // Server: direct to backend

const BASE_URL = API_URL === '/api' ? '' : API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        // If no refresh token, just reject without redirecting
        if (!refreshToken) {
          return Promise.reject(error);
        }

        const response = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { access_token } = response.data;
        localStorage.setItem('access_token', access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Clear tokens silently without redirecting
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        // Only redirect if we're not already on login/register pages
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };

// Auth API
export const authAPI = {
  register: (data: any) => api.post('/api/v1/auth/register', data),
  login: (username_or_email: string, password: string) =>
    api.post('/api/v1/auth/login', { username_or_email, password }),
  logout: () => api.post('/api/v1/auth/logout'),
  getCurrentUser: () => api.get('/api/v1/auth/me'),
  refreshToken: (refresh_token: string) =>
    api.post('/api/v1/auth/refresh', { refresh_token }),
};

// Users API
export const usersAPI = {
  list: (params?: any) => api.get('/api/v1/users', { params }),
  get: (id: string) => api.get(`/api/v1/users/${id}`),
  create: (data: any) => api.post('/api/v1/users', data),
  update: (id: string, data: any) => api.put(`/api/v1/users/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/users/${id}`),
};

// Company profile API (the tenant's identity: name, logo, address, tax IDs...)
export const companyAPI = {
  get: () => api.get('/api/v1/company/profile'),
  update: (data: any) => api.put('/api/v1/company/profile', data),
};

// Roles API
export const rolesAPI = {
  list: () => api.get('/api/v1/roles'),
  get: (id: string) => api.get(`/api/v1/roles/${id}`),
  create: (data: any) => api.post('/api/v1/roles', data),
  update: (id: string, data: any) => api.put(`/api/v1/roles/${id}`, data),
  delete: (id: string) => api.delete(`/api/v1/roles/${id}`),
  assignToUser: (userId: string, roleId: string) =>
    api.post('/api/v1/roles/assign', { user_id: userId, role_id: roleId }),
  removeFromUser: (userId: string, roleId: string) =>
    api.delete(`/api/v1/roles/assign/${userId}/${roleId}`),
};

// Permissions API
export const permissionsAPI = {
  list: (module?: string) =>
    api.get('/api/v1/permissions', { params: { module } }),
  getUserPermissions: (userId: string) =>
    api.get(`/api/v1/users/${userId}/permissions`),
  getMyPermissions: () => api.get('/api/v1/me/permissions'),
};

// Notifications API
export const notificationsAPI = {
  list: (params?: any) => api.get('/api/v1/notifications', { params }),
  getUnreadCount: () => api.get('/api/v1/notifications/unread/count'),
  markAsRead: (id: string) => api.put(`/api/v1/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/v1/notifications/mark-all-read'),
  delete: (id: string) => api.delete(`/api/v1/notifications/${id}`),
};

// User Settings API
export const userSettingsAPI = {
  getTheme: () => api.get('/api/v1/user-settings/theme'),
  saveTheme: (data: any) => api.put('/api/v1/user-settings/theme', data),
  getFeatures: () => api.get('/api/v1/user-settings/features'),
  saveFeatures: (data: any) => api.put('/api/v1/user-settings/features', data),
  getAll: () => api.get('/api/v1/user-settings'),
  saveAll: (data: any) => api.put('/api/v1/user-settings', data),
};

// Custom Fields API
// Served by the Core backend development endpoints.
export const customFieldsAPI = {
  // Alias used by shared/components/DynamicEntityForm. The form imports
  // `api` and calls `api.customFields.listDefinitions(...)` — so we attach
  // this object under both names. See `api.customFields = customFieldsAPI`
  // at the bottom of this file.
  listDefinitions: (params?: { entity_type?: string; is_visible?: boolean; skip?: number; limit?: number }) =>
    api.get<{ data: any[] }>('/api/v1/development/custom-fields/definitions', { params }),

  getDefinition: (id: string) =>
    api.get<any>(`/api/v1/development/custom-fields/definitions/${id}`),

  createDefinition: (data: any) =>
    api.post<any>('/api/v1/development/custom-fields/definitions', data),

  updateDefinition: (id: string, data: any) =>
    api.put<any>(`/api/v1/development/custom-fields/definitions/${id}`, data),

  deleteDefinition: (id: string) =>
    api.delete(`/api/v1/development/custom-fields/definitions/${id}`),

  getValuesForEntity: (entityType: string, entityId: string) =>
    api.get<any[]>(`/api/v1/development/custom-fields/values/${entityType}/${entityId}`),

  setValueForEntity: (entityType: string, entityId: string, data: any) =>
    api.post(`/api/v1/development/custom-fields/values/${entityType}/${entityId}`, data),
};

// Module Builder API - Drupal-like content type system
// Centralized in Core backend - NO CRM proxying
// Unified system: no distinction between system and custom modules
export const moduleBuilderAPI = {
  // Modules (unified - all modules treated equally like Drupal content types)
  listModules: (params?: { organization_id?: string; is_active?: boolean; scope?: string }) =>
    api.get<{ data: any[] }>('/api/v1/development/modules', { params }),

  getModule: (id: string) =>
    api.get<any>(`/api/v1/development/modules/${id}`),

  createModule: (data: any) =>
    api.post<any>('/api/v1/development/modules', data),

  updateModule: (id: string, data: any) =>
    api.put<any>(`/api/v1/development/modules/${id}`, data),

  deleteModule: (id: string, deletedBy: string) =>
    api.delete(`/api/v1/development/modules/${id}`, { params: { deleted_by: deletedBy } }),

  // Entity Types (previously called Components - renamed for consistency)
  listEntityTypes: (params?: { module_id?: string; organization_id?: string; is_active?: boolean }) =>
    api.get<{ data: any[] }>('/api/v1/development/entity-types', { params }),

  getEntityType: (id: string) =>
    api.get<any>(`/api/v1/development/entity-types/${id}`),

  createEntityType: (data: any) =>
    api.post<any>('/api/v1/development/entity-types', data),

  updateEntityType: (id: string, data: any) =>
    api.put<any>(`/api/v1/development/entity-types/${id}`, data),

  deleteEntityType: (id: string, deletedBy: string) =>
    api.delete(`/api/v1/development/entity-types/${id}`, { params: { deleted_by: deletedBy } }),

  // Combined - Full Drupal-like structure
  getModulesWithEntityTypes: (params?: { organization_id?: string }) =>
    api.get<{ data: any[] }>('/api/v1/development/modules-with-entity-types', { params }),

  // Backwards compatibility - Components API (deprecated)
  listComponents: (params?: { module_id?: string; is_active?: boolean }) => {
    console.warn('listComponents is deprecated. Use listEntityTypes instead.');
    return api.get<{ data: any[] }>('/api/v1/development/entity-types', { params });
  },

  getComponent: (id: string) => {
    console.warn('getComponent is deprecated. Use getEntityType instead.');
    return api.get<any>(`/api/v1/development/entity-types/${id}`);
  },

  createComponent: (data: any) => {
    console.warn('createComponent is deprecated. Use createEntityType instead.');
    return api.post<any>('/api/v1/development/entity-types', data);
  },

  updateComponent: (id: string, data: any) => {
    console.warn('updateComponent is deprecated. Use updateEntityType instead.');
    return api.put<any>(`/api/v1/development/entity-types/${id}`, data);
  },

  deleteComponent: (id: string, deletedBy: string = 'unknown') => {
    console.warn('deleteComponent is deprecated. Use deleteEntityType instead.');
    return api.delete(`/api/v1/development/entity-types/${id}`, { params: { deleted_by: deletedBy } });
  },

  getModulesWithComponents: (params?: { organization_id?: string }) => {
    console.warn('getModulesWithComponents is deprecated. Use getModulesWithEntityTypes instead.');
    return api.get<{ data: any[] }>('/api/v1/development/modules-with-entity-types', { params });
  },
};

// Entity Records API - Dynamic data storage for ALL modules
// Centralized in Core backend - Drupal-style universal entity storage
export const entityRecordsAPI = {
  create: (data: any) =>
    api.post<any>('/api/v1/development/entity-records', data),

  list: (params?: { entity_type?: string; module_code?: string; organization_id?: string; skip?: number; limit?: number }) =>
    api.get<{ data: any[] }>('/api/v1/development/entity-records', { params }),

  get: (id: string) =>
    api.get<any>(`/api/v1/development/entity-records/${id}`),

  update: (id: string, data: any) =>
    api.put<any>(`/api/v1/development/entity-records/${id}`, data),

  delete: (id: string, deletedBy: string) =>
    api.delete(`/api/v1/development/entity-records/${id}`, { params: { deleted_by: deletedBy } }),
};

// Option Lists API - Dropdown/picklist values management
export const optionListsAPI = {
  // Lists
  create: (data: any) =>
    api.post<any>('/api/v1/option-lists', data),

  list: (params?: { scope?: string; module_code?: string; entity_type?: string; organization_id?: string; include_system?: boolean; skip?: number; limit?: number }) =>
    api.get<{ lists: any[]; total: number }>('/api/v1/option-lists', { params }),

  get: (id: string) =>
    api.get<any>(`/api/v1/option-lists/${id}`),

  getByCode: (code: string, organizationId?: string) =>
    api.get<any>(`/api/v1/option-lists/code/${code}`, { params: { organization_id: organizationId } }),

  update: (id: string, data: any) =>
    api.put<any>(`/api/v1/option-lists/${id}`, data),

  delete: (id: string, deletedBy: string) =>
    api.delete(`/api/v1/option-lists/${id}`, { params: { deleted_by: deletedBy } }),

  // Items
  createItem: (listId: string, data: any, createdBy: string) =>
    api.post<any>(`/api/v1/option-lists/${listId}/items`, data, { params: { created_by: createdBy } }),

  listItems: (listId: string, activeOnly: boolean = true) =>
    api.get<any[]>(`/api/v1/option-lists/${listId}/items`, { params: { active_only: activeOnly } }),

  updateItem: (listId: string, itemId: string, data: any, updatedBy: string) =>
    api.put<any>(`/api/v1/option-lists/${listId}/items/${itemId}`, data, { params: { updated_by: updatedBy } }),

  deleteItem: (listId: string, itemId: string, deletedBy: string) =>
    api.delete(`/api/v1/option-lists/${listId}/items/${itemId}`, { params: { deleted_by: deletedBy } }),
};

// Theme System API - Drupal-style theme configuration
export const themeAPI = {
  // Themes
  listThemes: (params?: { organization_id?: string; is_active?: boolean }) =>
    api.get<{ data: any[] }>('/api/v1/frontend/themes', { params }),

  getTheme: (themeCode: string) =>
    api.get<any>(`/api/v1/frontend/themes/${themeCode}`),

  getActiveTheme: (organizationId?: string) =>
    api.get<any>('/api/v1/frontend/themes', { params: { organization_id: organizationId, is_active: true } })
      .then(response => response.data.data[0]),

  // Pages
  listPages: (params?: { theme_code?: string; page_type?: string; module_code?: string }) =>
    api.get<{ data: any[] }>('/api/v1/frontend/pages', { params }),

  getPageByRoute: (path: string) =>
    api.get<any>('/api/v1/frontend/pages/by-route', { params: { path } }),

  // Navigation Menus
  listMenus: (params?: { theme_code?: string; menu_type?: string; is_active?: boolean }) =>
    api.get<{ data: any[] }>('/api/v1/frontend/navigation-menus', { params }),

  getMenu: (menuCode: string) =>
    api.get<any>(`/api/v1/frontend/navigation-menus/${menuCode}`),

  // UI Components
  listComponents: (params?: { component_type?: string; module_code?: string }) =>
    api.get<{ data: any[] }>('/api/v1/frontend/ui-components', { params }),

  getComponent: (id: string) =>
    api.get<any>(`/api/v1/frontend/ui-components/${id}`),
};

// Attach commonly-needed sub-APIs as properties of `api` itself so shared
// components (e.g. DynamicEntityForm in /shared) can resolve them via
// `api.customFields.listDefinitions(...)` regardless of the host module's
// naming convention. Placed at the end of the file so all referenced
// objects are fully initialized.
(api as any).customFields = customFieldsAPI;
(api as any).development = moduleBuilderAPI;
(api as any).users = usersAPI;
(api as any).roles = rolesAPI;
