-- =====================================================
-- Shared Core Module - Database Schema
-- Multi-tenant SaaS Architecture
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ORGANIZATIONS (Tenants)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_code VARCHAR(50) UNIQUE NOT NULL,
    org_name VARCHAR(255) NOT NULL,
    org_type VARCHAR(50) DEFAULT 'business', -- business, enterprise, nonprofit, etc.

    -- Contact Information
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),

    -- Address
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),

    -- Business Details
    industry VARCHAR(100),
    company_size VARCHAR(50), -- 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+
    tax_id VARCHAR(100),

    -- Subscription & Billing
    subscription_tier VARCHAR(50) DEFAULT 'trial', -- trial, basic, professional, enterprise
    subscription_status VARCHAR(50) DEFAULT 'active', -- active, suspended, cancelled
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    billing_email VARCHAR(255),

    -- Module Access
    enabled_modules JSONB DEFAULT '[]', -- ["crm", "hr", "accounting", ...]
    module_settings JSONB DEFAULT '{}',

    -- Limits & Quotas
    max_users INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    current_users INTEGER DEFAULT 0,
    current_storage_gb NUMERIC(10,2) DEFAULT 0,

    -- Settings & Customization
    branding JSONB DEFAULT '{}', -- logo_url, primary_color, secondary_color, etc.
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    currency VARCHAR(10) DEFAULT 'USD',

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    onboarding_completed BOOLEAN DEFAULT false,

    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID,
    deleted_flag BOOLEAN DEFAULT false,
    deleted_date TIMESTAMP,

    CONSTRAINT check_max_users_positive CHECK (max_users > 0),
    CONSTRAINT check_storage_positive CHECK (max_storage_gb > 0)
);

CREATE INDEX idx_core_org_code ON core_organizations(org_code) WHERE deleted_flag = false;
CREATE INDEX idx_core_org_status ON core_organizations(subscription_status, is_active) WHERE deleted_flag = false;
CREATE INDEX idx_core_org_tier ON core_organizations(subscription_tier) WHERE deleted_flag = false;

-- =====================================================
-- 2. USERS (Cross-Module Authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,

    -- Authentication
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    display_name VARCHAR(255),
    avatar_url TEXT,

    -- Contact
    phone VARCHAR(50),
    mobile VARCHAR(50),

    -- Settings
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    preferences JSONB DEFAULT '{}',

    -- Security
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    last_login_date TIMESTAMP,
    last_login_ip VARCHAR(50),
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,

    -- Email Verification
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    email_verification_sent_at TIMESTAMP,

    -- Password Reset
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    account_status VARCHAR(50) DEFAULT 'active', -- active, suspended, locked, pending

    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID,
    deleted_flag BOOLEAN DEFAULT false,
    deleted_date TIMESTAMP
);

CREATE INDEX idx_core_users_org ON core_users(org_id) WHERE deleted_flag = false;
CREATE INDEX idx_core_users_email ON core_users(email) WHERE deleted_flag = false;
CREATE INDEX idx_core_users_username ON core_users(username) WHERE deleted_flag = false;
CREATE INDEX idx_core_users_status ON core_users(is_active, account_status) WHERE deleted_flag = false;

-- =====================================================
-- 3. ROLES (RBAC System)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES core_organizations(id) ON DELETE CASCADE, -- NULL for system-wide roles

    role_code VARCHAR(100) NOT NULL,
    role_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Type
    role_type VARCHAR(50) DEFAULT 'custom', -- system, custom
    is_system_role BOOLEAN DEFAULT false,

    -- Scope
    scope VARCHAR(50) DEFAULT 'organization', -- system, organization, module
    module_name VARCHAR(100), -- crm, hr, accounting, etc.

    -- Permissions (JSON array of permission codes)
    permissions JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID,
    deleted_flag BOOLEAN DEFAULT false,

    UNIQUE(org_id, role_code)
);

CREATE INDEX idx_core_roles_org ON core_roles(org_id) WHERE deleted_flag = false;
CREATE INDEX idx_core_roles_code ON core_roles(role_code) WHERE deleted_flag = false;
CREATE INDEX idx_core_roles_type ON core_roles(role_type, is_system_role) WHERE deleted_flag = false;

-- =====================================================
-- 4. USER-ROLE ASSIGNMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS core_user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core_users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES core_roles(id) ON DELETE CASCADE,

    -- Optional scope limitation
    scope_type VARCHAR(50), -- module, department, team, etc.
    scope_id UUID,

    -- Validity period
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP,

    -- Metadata
    assigned_by UUID REFERENCES core_users(id),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, role_id, scope_type, scope_id)
);

CREATE INDEX idx_core_user_roles_user ON core_user_roles(user_id);
CREATE INDEX idx_core_user_roles_role ON core_user_roles(role_id);

-- =====================================================
-- 5. PERMISSIONS (Fine-Grained Access Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    permission_code VARCHAR(100) UNIQUE NOT NULL,
    permission_name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Resource & Action
    resource VARCHAR(100) NOT NULL, -- users, roles, crm.accounts, hr.employees
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, approve, export

    -- Module
    module_name VARCHAR(100), -- crm, hr, accounting, core

    -- Type
    permission_type VARCHAR(50) DEFAULT 'standard', -- system, standard, custom

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID
);

CREATE INDEX idx_core_permissions_module ON core_permissions(module_name);
CREATE INDEX idx_core_permissions_resource ON core_permissions(resource, action);

-- =====================================================
-- 6. AUDIT LOGS (Cross-Module Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES core_organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES core_users(id) ON DELETE SET NULL,

    -- Event Details
    event_type VARCHAR(100) NOT NULL, -- user.login, crm.account.create, etc.
    event_category VARCHAR(50), -- auth, data, security, system
    module_name VARCHAR(100), -- crm, hr, accounting, core

    -- Action
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, login, logout
    resource_type VARCHAR(100), -- user, role, account, employee
    resource_id UUID,

    -- Request Details
    ip_address VARCHAR(50),
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,

    -- Changes (for data modifications)
    old_values JSONB,
    new_values JSONB,
    changes JSONB,

    -- Status
    status VARCHAR(50) DEFAULT 'success', -- success, failure, error
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Compliance
    retention_until TIMESTAMP -- For GDPR/compliance auto-deletion
);

CREATE INDEX idx_core_audit_org ON core_audit_logs(org_id, timestamp DESC);
CREATE INDEX idx_core_audit_user ON core_audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_core_audit_event ON core_audit_logs(event_type, timestamp DESC);
CREATE INDEX idx_core_audit_module ON core_audit_logs(module_name, timestamp DESC);
CREATE INDEX idx_core_audit_resource ON core_audit_logs(resource_type, resource_id);

-- =====================================================
-- 7. NOTIFICATIONS (Cross-Module Notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES core_organizations(id) ON DELETE CASCADE,

    -- Recipient
    user_id UUID REFERENCES core_users(id) ON DELETE CASCADE,

    -- Notification Details
    notification_type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
    category VARCHAR(50), -- system, task, approval, alert, info
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent

    -- Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label VARCHAR(100),

    -- Module Context
    module_name VARCHAR(100),
    resource_type VARCHAR(100),
    resource_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_date TIMESTAMP,

    -- Delivery Status (for email/sms)
    delivery_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, delivered, failed
    delivered_date TIMESTAMP,
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_date TIMESTAMP
);

CREATE INDEX idx_core_notif_user ON core_notifications(user_id, is_read, created_date DESC);
CREATE INDEX idx_core_notif_org ON core_notifications(org_id, created_date DESC);
CREATE INDEX idx_core_notif_type ON core_notifications(notification_type, delivery_status);

-- =====================================================
-- 8. SETTINGS (Global & Module Settings)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES core_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES core_users(id) ON DELETE CASCADE, -- NULL for org-wide settings

    -- Setting Details
    setting_category VARCHAR(100) NOT NULL, -- system, user, module, feature
    setting_key VARCHAR(255) NOT NULL,
    setting_value JSONB NOT NULL,

    -- Module Context
    module_name VARCHAR(100), -- NULL for global settings

    -- Type
    setting_type VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json, array
    is_encrypted BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT false, -- Can be accessed by frontend

    -- Validation
    allowed_values JSONB, -- For enum-type settings
    validation_rules JSONB,

    -- Metadata
    description TEXT,
    default_value JSONB,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID,

    UNIQUE(org_id, user_id, setting_category, setting_key, module_name)
);

CREATE INDEX idx_core_settings_org ON core_settings(org_id, setting_category);
CREATE INDEX idx_core_settings_user ON core_settings(user_id, setting_category);
CREATE INDEX idx_core_settings_module ON core_settings(module_name, setting_category);

-- =====================================================
-- 9. SESSIONS (User Sessions & Tokens)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core_users(id) ON DELETE CASCADE,

    -- Session Details
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,

    -- Device/Client Info
    device_type VARCHAR(50), -- web, mobile, desktop, api
    device_name VARCHAR(255),
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    revoked_by UUID
);

CREATE INDEX idx_core_sessions_user ON core_sessions(user_id, is_active);
CREATE INDEX idx_core_sessions_token ON core_sessions(session_token);
CREATE INDEX idx_core_sessions_expires ON core_sessions(expires_at) WHERE is_active = true;

-- =====================================================
-- 10. API KEYS (For Integrations & Third-Party Access)
-- =====================================================
CREATE TABLE IF NOT EXISTS core_api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES core_users(id) ON DELETE SET NULL,

    -- Key Details
    key_name VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    api_secret_hash VARCHAR(255), -- For API key + secret pairs

    -- Scope
    scope JSONB DEFAULT '[]', -- Array of allowed permissions/modules
    allowed_ips JSONB DEFAULT '[]', -- IP whitelist
    rate_limit INTEGER DEFAULT 1000, -- Requests per hour

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Usage Stats
    total_requests INTEGER DEFAULT 0,
    last_used_date TIMESTAMP,
    last_used_ip VARCHAR(50),

    -- Validity
    expires_at TIMESTAMP,

    -- Metadata
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    revoked_date TIMESTAMP,
    revoked_by UUID
);

CREATE INDEX idx_core_apikeys_org ON core_api_keys(org_id, is_active);
CREATE INDEX idx_core_apikeys_key ON core_api_keys(api_key) WHERE is_active = true;

-- =====================================================
-- SYSTEM ROLES & PERMISSIONS (Pre-populated Data)
-- =====================================================

-- Insert System Roles
INSERT INTO core_roles (id, role_code, role_name, description, role_type, is_system_role, scope, permissions)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'super_admin', 'Super Administrator', 'Full system access across all modules', 'system', true, 'system', '["*"]'),
    ('00000000-0000-0000-0000-000000000002', 'org_admin', 'Organization Administrator', 'Full access within organization', 'system', true, 'organization', '["organization.*", "users.*", "roles.*", "settings.*"]'),
    ('00000000-0000-0000-0000-000000000003', 'user', 'Standard User', 'Basic user access', 'system', true, 'organization', '["read.own.profile", "update.own.profile"]'),
    ('00000000-0000-0000-0000-000000000004', 'crm_admin', 'CRM Administrator', 'Full CRM module access', 'system', true, 'module', '["crm.*"]'),
    ('00000000-0000-0000-0000-000000000005', 'crm_user', 'CRM User', 'Standard CRM access', 'system', true, 'module', '["crm.read", "crm.create", "crm.update.own"]'),
    ('00000000-0000-0000-0000-000000000006', 'hr_admin', 'HR Administrator', 'Full HR module access', 'system', true, 'module', '["hr.*"]'),
    ('00000000-0000-0000-0000-000000000007', 'hr_user', 'HR User', 'Standard HR access', 'system', true, 'module', '["hr.read", "hr.update.own"]')
ON CONFLICT (id) DO NOTHING;

-- Insert Core Permissions
INSERT INTO core_permissions (permission_code, permission_name, description, resource, action, module_name, permission_type)
VALUES
    ('*', 'All Permissions', 'Super admin - all permissions', '*', '*', 'core', 'system'),
    ('organization.*', 'Manage Organization', 'All organization management permissions', 'organization', '*', 'core', 'system'),
    ('users.create', 'Create Users', 'Create new users', 'users', 'create', 'core', 'system'),
    ('users.read', 'View Users', 'View user information', 'users', 'read', 'core', 'system'),
    ('users.update', 'Update Users', 'Update user information', 'users', 'update', 'core', 'system'),
    ('users.delete', 'Delete Users', 'Delete users', 'users', 'delete', 'core', 'system'),
    ('roles.create', 'Create Roles', 'Create new roles', 'roles', 'create', 'core', 'system'),
    ('roles.read', 'View Roles', 'View role information', 'roles', 'read', 'core', 'system'),
    ('roles.update', 'Update Roles', 'Update role information', 'roles', 'update', 'core', 'system'),
    ('roles.delete', 'Delete Roles', 'Delete roles', 'roles', 'delete', 'core', 'system'),
    ('settings.*', 'Manage Settings', 'All settings permissions', 'settings', '*', 'core', 'system'),
    ('crm.*', 'CRM Full Access', 'All CRM module permissions', 'crm', '*', 'crm', 'system'),
    ('crm.read', 'CRM Read Access', 'View CRM data', 'crm', 'read', 'crm', 'system'),
    ('crm.create', 'CRM Create Access', 'Create CRM records', 'crm', 'create', 'crm', 'system'),
    ('crm.update', 'CRM Update Access', 'Update CRM records', 'crm', 'update', 'crm', 'system'),
    ('hr.*', 'HR Full Access', 'All HR module permissions', 'hr', '*', 'hr', 'system'),
    ('hr.read', 'HR Read Access', 'View HR data', 'hr', 'read', 'hr', 'system')
ON CONFLICT (permission_code) DO NOTHING;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION core_check_user_permission(
    p_user_id UUID,
    p_permission_code VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM core_user_roles ur
        JOIN core_roles r ON ur.role_id = r.id
        WHERE ur.user_id = p_user_id
        AND r.is_active = true
        AND r.deleted_flag = false
        AND (
            r.permissions @> '["*"]'::jsonb
            OR r.permissions @> to_jsonb(ARRAY[p_permission_code])
            OR r.permissions @> to_jsonb(ARRAY[split_part(p_permission_code, '.', 1) || '.*'])
        )
        AND (ur.valid_until IS NULL OR ur.valid_until > CURRENT_TIMESTAMP)
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION core_get_user_org(
    p_user_id UUID
) RETURNS UUID AS $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT org_id INTO v_org_id
    FROM core_users
    WHERE id = p_user_id
    AND deleted_flag = false;

    RETURN v_org_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE core_organizations IS 'Multi-tenant organizations (customers/tenants)';
COMMENT ON TABLE core_users IS 'Cross-module user authentication and profiles';
COMMENT ON TABLE core_roles IS 'Role-based access control system';
COMMENT ON TABLE core_permissions IS 'Fine-grained permission definitions';
COMMENT ON TABLE core_audit_logs IS 'Cross-module audit trail for compliance';
COMMENT ON TABLE core_notifications IS 'Unified notification system';
COMMENT ON TABLE core_settings IS 'Global and module-specific settings';
COMMENT ON TABLE core_sessions IS 'Active user sessions and tokens';
COMMENT ON TABLE core_api_keys IS 'API keys for integrations';
