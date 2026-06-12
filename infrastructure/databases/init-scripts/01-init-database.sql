-- Initialize Business Management Platform Database
-- This script creates the base schema for all modules

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for each module
CREATE SCHEMA IF NOT EXISTS dashboard;
CREATE SCHEMA IF NOT EXISTS accounting;
CREATE SCHEMA IF NOT EXISTS administration;
CREATE SCHEMA IF NOT EXISTS sales;
CREATE SCHEMA IF NOT EXISTS hr;
CREATE SCHEMA IF NOT EXISTS legal;
CREATE SCHEMA IF NOT EXISTS rd;
CREATE SCHEMA IF NOT EXISTS shared;

-- Users table (shared across all modules)
CREATE TABLE IF NOT EXISTS shared.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User permissions
CREATE TABLE IF NOT EXISTS shared.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    module VARCHAR(100) NOT NULL,
    actions TEXT[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs (shared)
CREATE TABLE IF NOT EXISTS shared.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    changes JSONB,
    user_id UUID REFERENCES shared.users(id),
    module VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard schema tables
CREATE TABLE IF NOT EXISTS dashboard.widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    configuration JSONB,
    position JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES shared.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50),
    read BOOLEAN DEFAULT false,
    module VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accounting schema tables
CREATE TABLE IF NOT EXISTS accounting.accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES accounting.accounts(id),
    balance DECIMAL(15, 2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    created_by UUID REFERENCES shared.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS accounting.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    debit_account_id UUID REFERENCES accounting.accounts(id),
    credit_account_id UUID REFERENCES accounting.accounts(id),
    status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES shared.users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON shared.users(email);
CREATE INDEX idx_permissions_user_id ON shared.permissions(user_id);
CREATE INDEX idx_audit_logs_entity ON shared.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON shared.audit_logs(user_id);
CREATE INDEX idx_transactions_date ON accounting.transactions(transaction_date);
CREATE INDEX idx_notifications_user ON dashboard.notifications(user_id, read);

-- Insert default admin user (password: admin123 - change in production)
INSERT INTO shared.users (email, password_hash, name, role)
VALUES (
    'admin@example.com',
    crypt('admin123', gen_salt('bf')),
    'System Administrator',
    'super_admin'
) ON CONFLICT (email) DO NOTHING;
