-- =====================================================
-- Centralized Entity Management System Migration
-- Drupal-style Universal Entity Architecture
-- =====================================================
-- This migration centralizes ALL entity management in Core backend:
-- 1. Modules (unified - no system vs custom distinction)
-- 2. Entity Types (previously Components)
-- 3. Entity Records (universal dynamic data storage)
-- 4. Custom Fields (moved from CRM to Core)
-- 5. Option Lists (centralized dropdown/picklist values)
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MODULES TABLE - Unified Module System
-- =====================================================
-- NO distinction between "System Modules" and "Custom Modules"
-- All modules treated equally like Drupal content types

CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Module Identification
    module_code VARCHAR(50) UNIQUE NOT NULL,  -- inventory, crm, real_estate, etc.
    module_name VARCHAR(255) NOT NULL,         -- "Inventory Management", "CRM"
    module_label VARCHAR(255) NOT NULL,        -- Display name

    -- Module Metadata
    description TEXT,
    icon VARCHAR(50),                          -- Icon name (lucide-react, heroicons)
    color VARCHAR(20),                         -- UI theme color

    -- Module Configuration
    route_path VARCHAR(100),                   -- /inventory, /crm, /real-estate
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- Module Type (for organization only, NOT functional distinction)
    module_type VARCHAR(50) DEFAULT 'custom',  -- core, custom, third_party (just labels)

    -- Scope
    scope VARCHAR(50) DEFAULT 'organization',  -- system, organization, user
    organization_id UUID,                      -- NULL for system modules

    -- Settings
    settings JSONB DEFAULT '{}',               -- Module-specific settings

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP
);

-- Indexes for Modules
CREATE INDEX idx_modules_code ON modules(module_code, is_deleted);
CREATE INDEX idx_modules_org ON modules(organization_id, is_deleted);
CREATE INDEX idx_modules_active ON modules(is_active, is_deleted);

COMMENT ON TABLE modules IS 'Unified module system - all modules treated equally (no system vs custom distinction)';


-- =====================================================
-- 2. ENTITY TYPES TABLE - Like Drupal Content Types
-- =====================================================
-- Defines what entities exist in each module
-- Examples:
--   CRM module: accounts, contacts, opportunities, leads
--   Inventory module: warehouses, stock_items, stock_transfers
--   Real Estate module: properties, listings, agents

CREATE TABLE IF NOT EXISTS entity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Entity Identification
    entity_type_code VARCHAR(100) NOT NULL,         -- warehouses, accounts, properties
    entity_type_name VARCHAR(255) NOT NULL,         -- "Warehouses", "Accounts"
    entity_type_label VARCHAR(255) NOT NULL,        -- Display name (singular)
    entity_type_label_plural VARCHAR(255) NOT NULL, -- Display name (plural)

    -- Module Reference
    module_id UUID NOT NULL,

    -- Entity Metadata
    description TEXT,
    icon VARCHAR(50),                               -- Icon for this entity type

    -- Configuration
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,

    -- UI Configuration
    list_view_config JSONB DEFAULT '{}',            -- Table columns, filters
    form_config JSONB DEFAULT '{}',                 -- Form layout, tabs
    detail_view_config JSONB DEFAULT '{}',          -- Detail page layout

    -- Permissions
    permissions JSONB DEFAULT '{}',                 -- CRUD permissions configuration

    -- Organization
    organization_id UUID,                           -- NULL for system entity types

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_entity_types_module FOREIGN KEY (module_id)
        REFERENCES modules(id) ON DELETE CASCADE
);

-- Indexes for Entity Types
CREATE INDEX idx_entity_types_code ON entity_types(entity_type_code, is_deleted);
CREATE INDEX idx_entity_types_module ON entity_types(module_id, is_deleted);
CREATE INDEX idx_entity_types_org ON entity_types(organization_id, is_deleted);

COMMENT ON TABLE entity_types IS 'Entity type definitions - like Drupal content types. Defines entities in each module.';


-- =====================================================
-- 3. ENTITY RECORDS TABLE - Universal Entity Storage
-- =====================================================
-- Drupal-style content storage system that works for ALL modules
-- Stores dynamic data in JSON column

CREATE TABLE IF NOT EXISTS entity_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Entity Identification
    entity_type VARCHAR(100) NOT NULL,              -- warehouses, accounts, products
    module_code VARCHAR(50) NOT NULL,               -- inventory, crm, scm

    -- Dynamic Data Storage (all field values stored as JSON)
    data JSONB NOT NULL DEFAULT '{}',

    -- Organization (multi-tenancy)
    organization_id UUID NOT NULL,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP
);

-- Indexes for Entity Records
CREATE INDEX idx_entity_records_type_module ON entity_records(entity_type, module_code, is_deleted);
CREATE INDEX idx_entity_records_org ON entity_records(organization_id, is_deleted);
CREATE INDEX idx_entity_records_module ON entity_records(module_code, is_deleted);
CREATE INDEX idx_entity_records_data ON entity_records USING GIN (data);  -- For JSON queries

COMMENT ON TABLE entity_records IS 'Universal entity record storage for ALL modules - Drupal-style dynamic data';


-- =====================================================
-- 4. CUSTOM FIELD DEFINITIONS TABLE
-- =====================================================
-- Moved from CRM backend to Core for centralization
-- Supports ALL modules and entity types

CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Field Metadata
    field_name VARCHAR(100) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,                -- text, number, date, boolean, picklist, etc.
    entity_type VARCHAR(50) NOT NULL,               -- accounts, warehouses, products, etc.

    -- Module identification (for multi-module support)
    module_code VARCHAR(50),                        -- inventory, scm, crm, etc.

    -- Field Configuration
    is_required BOOLEAN DEFAULT false,
    is_unique BOOLEAN DEFAULT false,
    is_searchable BOOLEAN DEFAULT true,
    default_value TEXT,
    help_text TEXT,

    -- For picklist/multi_picklist types
    picklist_values JSONB,                          -- DEPRECATED - use list_code instead
    list_code VARCHAR(100),                         -- Reference to option_lists.list_code

    -- Validation rules
    validation_type VARCHAR(50),                    -- regex, range, length, etc.
    validation_rule JSONB,                          -- Validation configuration

    -- Display configuration
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    field_group VARCHAR(100),                       -- Group related fields together

    -- Organization
    organization_id UUID NOT NULL,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP
);

-- Indexes for Custom Field Definitions
CREATE INDEX idx_custom_field_definitions_entity ON custom_field_definitions(entity_type, is_deleted);
CREATE INDEX idx_custom_field_definitions_module ON custom_field_definitions(module_code, is_deleted);
CREATE INDEX idx_custom_field_definitions_name ON custom_field_definitions(field_name);
CREATE INDEX idx_custom_field_definitions_org ON custom_field_definitions(organization_id);

COMMENT ON TABLE custom_field_definitions IS 'Custom field definitions for ALL modules - centralized in Core';


-- =====================================================
-- 5. CUSTOM FIELD VALUES TABLE
-- =====================================================
-- Stores actual custom field values for each record
-- Polymorphic value storage - uses appropriate column

CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- References
    field_definition_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,

    -- Module identification
    module_code VARCHAR(50),

    -- Polymorphic Value Storage (use appropriate column based on field type)
    value_text TEXT,
    value_number NUMERIC(20, 4),
    value_date DATE,
    value_datetime TIMESTAMP,
    value_boolean BOOLEAN,
    value_json JSONB,                               -- For complex types (multi_picklist, arrays)

    -- Organization
    organization_id UUID NOT NULL,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    -- Foreign Key
    CONSTRAINT fk_custom_field_values_definition FOREIGN KEY (field_definition_id)
        REFERENCES custom_field_definitions(id) ON DELETE CASCADE
);

-- Indexes for Custom Field Values
CREATE INDEX idx_custom_field_values_entity ON custom_field_values(entity_type, entity_id, is_deleted);
CREATE INDEX idx_custom_field_values_field ON custom_field_values(field_definition_id);
CREATE INDEX idx_custom_field_values_module ON custom_field_values(module_code);
CREATE INDEX idx_custom_field_values_org ON custom_field_values(organization_id);

COMMENT ON TABLE custom_field_values IS 'Custom field values for ALL modules - polymorphic storage';


-- =====================================================
-- 6. OPTION LISTS TABLE - Centralized Dropdown Values
-- =====================================================
-- Replaces the old Categories system
-- Used for dropdowns, picklists, select fields

CREATE TABLE IF NOT EXISTS option_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- List Identification
    list_code VARCHAR(100) NOT NULL,                -- warehouse_types, account_statuses
    list_name VARCHAR(255) NOT NULL,                -- "Warehouse Types", "Account Statuses"
    list_label VARCHAR(255) NOT NULL,               -- Display name

    -- List Metadata
    description TEXT,

    -- Scope
    scope VARCHAR(50) DEFAULT 'organization',       -- system, organization, module
    module_code VARCHAR(50),                        -- inventory, crm, scm (NULL for global)
    entity_type VARCHAR(100),                       -- warehouses, accounts (NULL for global)

    -- Configuration
    is_active BOOLEAN DEFAULT true,
    allow_custom_values BOOLEAN DEFAULT false,      -- Allow users to add custom values
    is_hierarchical BOOLEAN DEFAULT false,          -- Support parent-child relationships

    -- Organization
    organization_id UUID,                           -- NULL for system lists

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    -- Unique constraint: list_code must be unique per organization
    CONSTRAINT uq_option_lists_code_org UNIQUE (list_code, organization_id)
);

-- Indexes for Option Lists
CREATE INDEX idx_option_lists_code ON option_lists(list_code, is_deleted);
CREATE INDEX idx_option_lists_module ON option_lists(module_code, is_deleted);
CREATE INDEX idx_option_lists_entity ON option_lists(entity_type, is_deleted);
CREATE INDEX idx_option_lists_org ON option_lists(organization_id, is_deleted);

COMMENT ON TABLE option_lists IS 'Centralized dropdown/picklist value lists - replaces Categories';


-- =====================================================
-- 7. OPTION LIST ITEMS TABLE
-- =====================================================
-- Individual items/options within each list

CREATE TABLE IF NOT EXISTS option_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- List Reference
    list_id UUID NOT NULL,

    -- Item Details
    option_value VARCHAR(255) NOT NULL,             -- Internal value (e.g., "cold_storage")
    option_label VARCHAR(255) NOT NULL,             -- Display label (e.g., "Cold Storage")

    -- Optional additional data
    description TEXT,
    color VARCHAR(20),                              -- For UI color coding
    icon VARCHAR(50),                               -- Icon name
    item_metadata JSONB DEFAULT '{}',               -- Additional custom data

    -- Hierarchy Support
    parent_item_id UUID,                            -- For hierarchical lists

    -- Display
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,               -- Default selection

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    -- Foreign Keys
    CONSTRAINT fk_option_list_items_list FOREIGN KEY (list_id)
        REFERENCES option_lists(id) ON DELETE CASCADE,
    CONSTRAINT fk_option_list_items_parent FOREIGN KEY (parent_item_id)
        REFERENCES option_list_items(id) ON DELETE SET NULL
);

-- Indexes for Option List Items
CREATE INDEX idx_option_list_items_list ON option_list_items(list_id, is_deleted);
CREATE INDEX idx_option_list_items_value ON option_list_items(option_value);
CREATE INDEX idx_option_list_items_order ON option_list_items(list_id, display_order, is_deleted);
CREATE INDEX idx_option_list_items_parent ON option_list_items(parent_item_id);

COMMENT ON TABLE option_list_items IS 'Individual items within option lists';


-- =====================================================
-- DATA MIGRATION: Pre-populate System Data
-- =====================================================

-- Insert System Modules (examples - adjust as needed)
INSERT INTO modules (id, module_code, module_name, module_label, description, icon, color, route_path, module_type, scope, is_active, display_order, created_by, last_modified_by)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'core', 'Core', 'Core System', 'Core system functionality', 'settings', '#6366f1', '/core', 'core', 'system', true, 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000002', 'crm', 'CRM', 'Customer Relationship Management', 'Manage customers, leads, and sales', 'users', '#3b82f6', '/crm', 'core', 'system', true, 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000003', 'inventory', 'Inventory', 'Inventory Management', 'Manage warehouses, stock, and transfers', 'package', '#10b981', '/inventory', 'core', 'system', true, 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000004', 'scm', 'SCM', 'Supply Chain Management', 'Manage suppliers, orders, and shipments', 'truck', '#f59e0b', '/scm', 'core', 'system', true, 4, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000005', 'customer-service', 'Customer Service', 'Customer Service', 'Manage tickets, cases, and support', 'headphones', '#8b5cf6', '/customer-service', 'core', 'system', true, 5, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000006', 'project-management', 'Project Management', 'Project Management', 'Manage projects, tasks, and milestones', 'clipboard', '#06b6d4', '/pm', 'core', 'system', true, 6, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('10000000-0000-0000-0000-000000000007', 'rd', 'R&D', 'Research & Development', 'Manage research projects and experiments', 'flask', '#ec4899', '/rd', 'core', 'system', true, 7, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert Example Entity Types for Inventory Module
INSERT INTO entity_types (id, entity_type_code, entity_type_name, entity_type_label, entity_type_label_plural, module_id, description, icon, is_active, display_order, created_by, last_modified_by)
VALUES
    ('20000000-0000-0000-0000-000000000001', 'warehouses', 'Warehouses', 'Warehouse', 'Warehouses', '10000000-0000-0000-0000-000000000003', 'Storage facilities', 'warehouse', true, 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000002', 'stock_items', 'Stock Items', 'Stock Item', 'Stock Items', '10000000-0000-0000-0000-000000000003', 'Inventory items', 'box', true, 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000003', 'stock_transfers', 'Stock Transfers', 'Stock Transfer', 'Stock Transfers', '10000000-0000-0000-0000-000000000003', 'Warehouse transfers', 'arrow-right-left', true, 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert Example Entity Types for CRM Module
INSERT INTO entity_types (id, entity_type_code, entity_type_name, entity_type_label, entity_type_label_plural, module_id, description, icon, is_active, display_order, created_by, last_modified_by)
VALUES
    ('20000000-0000-0000-0000-000000000010', 'accounts', 'Accounts', 'Account', 'Accounts', '10000000-0000-0000-0000-000000000002', 'Customer accounts', 'building', true, 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000011', 'contacts', 'Contacts', 'Contact', 'Contacts', '10000000-0000-0000-0000-000000000002', 'Contact persons', 'user', true, 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000012', 'leads', 'Leads', 'Lead', 'Leads', '10000000-0000-0000-0000-000000000002', 'Sales leads', 'target', true, 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('20000000-0000-0000-0000-000000000013', 'opportunities', 'Opportunities', 'Opportunity', 'Opportunities', '10000000-0000-0000-0000-000000000002', 'Sales opportunities', 'trending-up', true, 4, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert Example Option Lists
INSERT INTO option_lists (id, list_code, list_name, list_label, description, scope, is_active, created_by, last_modified_by)
VALUES
    ('30000000-0000-0000-0000-000000000001', 'warehouse_types', 'Warehouse Types', 'Warehouse Types', 'Types of warehouses', 'system', true, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'account_statuses', 'Account Statuses', 'Account Statuses', 'CRM account statuses', 'system', true, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'lead_sources', 'Lead Sources', 'Lead Sources', 'Where leads come from', 'system', true, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert Example Option List Items
INSERT INTO option_list_items (list_id, option_value, option_label, description, display_order, created_by, last_modified_by)
VALUES
    -- Warehouse Types
    ('30000000-0000-0000-0000-000000000001', 'distribution', 'Distribution Center', 'Central distribution warehouse', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000001', 'fulfillment', 'Fulfillment Center', 'Order fulfillment warehouse', 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000001', 'cold_storage', 'Cold Storage', 'Temperature-controlled storage', 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000001', 'retail', 'Retail Store', 'Retail location with storage', 4, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

    -- Account Statuses
    ('30000000-0000-0000-0000-000000000002', 'active', 'Active', 'Active account', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'inactive', 'Inactive', 'Inactive account', 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'prospect', 'Prospect', 'Potential customer', 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000002', 'customer', 'Customer', 'Active customer', 4, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),

    -- Lead Sources
    ('30000000-0000-0000-0000-000000000003', 'website', 'Website', 'Website inquiry', 1, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'referral', 'Referral', 'Customer referral', 2, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'cold_call', 'Cold Call', 'Outbound cold call', 3, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'social_media', 'Social Media', 'Social media contact', 4, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
    ('30000000-0000-0000-0000-000000000003', 'event', 'Event', 'Trade show or event', 5, '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;


-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to get all entity types for a module
CREATE OR REPLACE FUNCTION get_module_entity_types(
    p_module_id UUID
) RETURNS TABLE (
    id UUID,
    entity_type_code VARCHAR,
    entity_type_name VARCHAR,
    entity_type_label VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT et.id, et.entity_type_code, et.entity_type_name, et.entity_type_label
    FROM entity_types et
    WHERE et.module_id = p_module_id
    AND et.is_deleted = 'N'
    AND et.is_active = true
    ORDER BY et.display_order, et.entity_type_name;
END;
$$ LANGUAGE plpgsql;

-- Function to get option list items
CREATE OR REPLACE FUNCTION get_option_list_items(
    p_list_code VARCHAR,
    p_organization_id UUID DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    option_value VARCHAR,
    option_label VARCHAR,
    display_order INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT oli.id, oli.option_value, oli.option_label, oli.display_order
    FROM option_list_items oli
    JOIN option_lists ol ON oli.list_id = ol.id
    WHERE ol.list_code = p_list_code
    AND ol.is_deleted = 'N'
    AND oli.is_deleted = 'N'
    AND oli.is_active = true
    AND (
        p_organization_id IS NULL
        OR ol.organization_id IS NULL
        OR ol.organization_id = p_organization_id
    )
    ORDER BY oli.display_order, oli.option_label;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✓ Centralized Entity Management System migration completed successfully!';
    RAISE NOTICE '  - Modules table created (unified system - no system vs custom distinction)';
    RAISE NOTICE '  - Entity Types table created (Drupal-style content types)';
    RAISE NOTICE '  - Entity Records table created (universal dynamic storage)';
    RAISE NOTICE '  - Custom Field Definitions table created (centralized from CRM)';
    RAISE NOTICE '  - Custom Field Values table created (polymorphic storage)';
    RAISE NOTICE '  - Option Lists table created (replaces Categories)';
    RAISE NOTICE '  - Option List Items table created';
    RAISE NOTICE '  - System data pre-populated (7 modules, example entity types, option lists)';
    RAISE NOTICE '';
    RAISE NOTICE '  Next steps:';
    RAISE NOTICE '  1. Migrate existing data from module-specific tables';
    RAISE NOTICE '  2. Update application code to use new centralized tables';
    RAISE NOTICE '  3. Test CRUD operations on all entity types';
END $$;
