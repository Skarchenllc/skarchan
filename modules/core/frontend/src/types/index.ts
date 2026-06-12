// User types
export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_superuser?: boolean;
  org_id?: string;
  organization_id?: string;
  created_date?: string;
  last_modified_date?: string;
  // legacy aliases (some older endpoints still emit these)
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Role types
export interface Role {
  id: string;
  role_code: string;
  role_name: string;
  role_description?: string;
  org_id?: string;
  is_active: boolean;
  is_system_role?: boolean;
  is_custom_role?: boolean;
  permissions?: string[] | Permission[];
  created_date?: string;
  last_modified_date?: string;
  // legacy aliases
  name?: string;
  description?: string;
  organization_id?: string;
}

// Permission types
export interface Permission {
  id: string;
  name: string;
  code: string;
  description?: string;
  module: string;
  resource: string;
  action: string;
  created_at: string;
  updated_at: string;
}

// Notification types
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export enum NotificationCategory {
  SYSTEM = 'system',
  USER = 'user',
  SECURITY = 'security',
  INFO = 'info',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Auth types
export interface LoginCredentials {
  username_or_email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
  org_name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  status_code?: number;
}
