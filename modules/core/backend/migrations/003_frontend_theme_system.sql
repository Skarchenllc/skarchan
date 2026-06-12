-- =====================================================
-- Frontend Theme System Migration
-- Drupal-style theme/layout management
-- Makes frontends configurable entities
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. THEMES TABLE - Frontend Theme Definitions
-- =====================================================
-- Like Drupal themes - different UI styles/layouts

CREATE TABLE IF NOT EXISTS themes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Theme Identification
    theme_code VARCHAR(50) UNIQUE NOT NULL,
    theme_name VARCHAR(255) NOT NULL,
    theme_label VARCHAR(255) NOT NULL,

    -- Theme Metadata
    description TEXT,
    version VARCHAR(20),
    author VARCHAR(255),

    -- Theme Configuration
    base_url VARCHAR(255),                     -- /admin, /app, /portal
    layout_type VARCHAR(50) DEFAULT 'sidebar', -- sidebar, topbar, dashboard
    color_scheme VARCHAR(50) DEFAULT 'light',  -- light, dark, auto

    -- Theme Assets
    logo_url TEXT,
    favicon_url TEXT,
    css_file_url TEXT,
    js_file_url TEXT,

    -- Layout Configuration
    layout_config JSONB DEFAULT '{}',          -- Sidebar, header, footer configs
    navigation_config JSONB DEFAULT '{}',      -- Menu structure
    component_library VARCHAR(100),            -- 'shadcn', 'antd', 'mui', 'custom'

    -- Styling
    primary_color VARCHAR(20),
    secondary_color VARCHAR(20),
    custom_css TEXT,
    custom_js TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,

    -- Scope
    scope VARCHAR(50) DEFAULT 'global',        -- global, organization, module
    organization_id UUID,
    module_code VARCHAR(50),

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

CREATE INDEX idx_themes_code ON themes(theme_code, is_deleted);
CREATE INDEX idx_themes_active ON themes(is_active, is_deleted);
CREATE INDEX idx_themes_org ON themes(organization_id, is_deleted);

COMMENT ON TABLE themes IS 'Frontend theme definitions - like Drupal themes';


-- =====================================================
-- 2. PAGES TABLE - Dynamic Page Definitions
-- =====================================================
-- Define pages/routes dynamically (like WordPress pages)

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Page Identification
    page_code VARCHAR(100) NOT NULL,
    page_name VARCHAR(255) NOT NULL,
    page_title VARCHAR(255) NOT NULL,

    -- Route Configuration
    route_path VARCHAR(255) NOT NULL,          -- /dashboard, /inventory/warehouses
    route_params JSONB DEFAULT '[]',           -- Dynamic route parameters

    -- Module Association
    module_code VARCHAR(50),
    entity_type_code VARCHAR(100),             -- If page displays entity data

    -- Page Type
    page_type VARCHAR(50) DEFAULT 'custom',    -- list, detail, form, dashboard, custom
    
    -- Layout & Components
    layout_template VARCHAR(100),              -- dashboard-grid, list-table, form-wizard
    components JSONB DEFAULT '[]',             -- Array of component configs
    
    -- Page Configuration
    page_config JSONB DEFAULT '{}',            -- Filters, columns, actions
    metadata JSONB DEFAULT '{}',               -- SEO, analytics
    
    -- Permissions
    required_permissions JSONB DEFAULT '[]',   -- Array of permission codes
    is_public BOOLEAN DEFAULT false,

    -- Display
    icon VARCHAR(50),
    display_order INTEGER DEFAULT 0,
    show_in_navigation BOOLEAN DEFAULT true,
    parent_page_id UUID,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Organization
    organization_id UUID,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_pages_parent FOREIGN KEY (parent_page_id)
        REFERENCES pages(id) ON DELETE SET NULL
);

CREATE INDEX idx_pages_route ON pages(route_path, is_deleted);
CREATE INDEX idx_pages_module ON pages(module_code, is_deleted);
CREATE INDEX idx_pages_entity ON pages(entity_type_code, is_deleted);
CREATE INDEX idx_pages_org ON pages(organization_id, is_deleted);
CREATE INDEX idx_pages_parent ON pages(parent_page_id);

COMMENT ON TABLE pages IS 'Dynamic page/route definitions - configurable UI pages';


-- =====================================================
-- 3. COMPONENTS TABLE - Reusable UI Components
-- =====================================================
-- Store component configurations (cards, tables, forms)

CREATE TABLE IF NOT EXISTS ui_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Component Identification
    component_code VARCHAR(100) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    component_type VARCHAR(50) NOT NULL,       -- table, form, card, chart, widget

    -- Component Configuration
    component_config JSONB NOT NULL DEFAULT '{}',
    
    -- Data Source
    data_source_type VARCHAR(50),              -- api, entity, static, custom
    data_source_config JSONB DEFAULT '{}',     -- API endpoint, entity type, etc.

    -- Styling
    css_classes TEXT,
    inline_styles JSONB DEFAULT '{}',

    -- Component Props
    props JSONB DEFAULT '{}',

    -- Reusability
    is_reusable BOOLEAN DEFAULT true,
    category VARCHAR(100),                     -- widgets, forms, charts, etc.

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Organization
    organization_id UUID,

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

CREATE INDEX idx_components_code ON ui_components(component_code, is_deleted);
CREATE INDEX idx_components_type ON ui_components(component_type, is_deleted);
CREATE INDEX idx_components_org ON ui_components(organization_id, is_deleted);

COMMENT ON TABLE ui_components IS 'Reusable UI component configurations';


-- =====================================================
-- 4. NAVIGATION MENUS TABLE
-- =====================================================
-- Define navigation menu structure

CREATE TABLE IF NOT EXISTS navigation_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Menu Identification
    menu_code VARCHAR(100) NOT NULL,
    menu_name VARCHAR(255) NOT NULL,
    menu_location VARCHAR(50),                 -- sidebar, topbar, footer

    -- Menu Configuration
    menu_items JSONB NOT NULL DEFAULT '[]',    -- Array of menu item configs
    
    -- Theme Association
    theme_id UUID,

    -- Status
    is_active BOOLEAN DEFAULT true,

    -- Organization
    organization_id UUID,

    -- Audit Trail
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    last_modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified_by UUID NOT NULL,

    -- Soft Delete
    is_deleted VARCHAR(1) DEFAULT 'N' NOT NULL,
    deleted_by UUID,
    deleted_at TIMESTAMP,

    CONSTRAINT fk_navigation_theme FOREIGN KEY (theme_id)
        REFERENCES themes(id) ON DELETE SET NULL
);

CREATE INDEX idx_nav_code ON navigation_menus(menu_code, is_deleted);
CREATE INDEX idx_nav_location ON navigation_menus(menu_location, is_deleted);
CREATE INDEX idx_nav_theme ON navigation_menus(theme_id);

COMMENT ON TABLE navigation_menus IS 'Dynamic navigation menu definitions';


-- =====================================================
-- 5. INSERT DEFAULT THEME
-- =====================================================

INSERT INTO themes (
    theme_code,
    theme_name,
    theme_label,
    description,
    version,
    layout_type,
    color_scheme,
    component_library,
    primary_color,
    secondary_color,
    is_active,
    is_default,
    scope,
    created_by,
    last_modified_by
) VALUES (
    'default',
    'Default Theme',
    'Default Business Theme',
    'Default theme with sidebar navigation',
    '1.0.0',
    'sidebar',
    'light',
    'shadcn',
    '#3b82f6',
    '#8b5cf6',
    true,
    true,
    'global',
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001'
);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✓ Frontend Theme System migration completed!';
    RAISE NOTICE '  - Themes table created';
    RAISE NOTICE '  - Pages table created (dynamic routes)';
    RAISE NOTICE '  - UI Components table created';
    RAISE NOTICE '  - Navigation Menus table created';
    RAISE NOTICE '  - Default theme inserted';
    RAISE NOTICE '';
    RAISE NOTICE '  Frontend is now an entity - fully configurable!';
END $$;
