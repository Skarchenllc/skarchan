-- Add missing Chart of Accounts for Tech Companies
-- Run this script to add important accounts missing from the current structure

BEGIN;

-- =====================================================
-- ASSETS (1070-1220)
-- =====================================================

-- Current Assets
INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '1070', 'Prepaid Expenses', 'ASSET', 'Current Assets', 0, 'USD', true, 'Insurance, subscriptions, and other expenses paid in advance'),
(gen_random_uuid(), '1080', 'Prepaid Software Licenses', 'ASSET', 'Current Assets', 0, 'USD', true, 'Annual software licenses paid in advance'),
(gen_random_uuid(), '1090', 'Security Deposits', 'ASSET', 'Current Assets', 0, 'USD', true, 'Office lease, utility, and other security deposits');

-- Fixed/Intangible Assets
INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '1200', 'Intangible Assets', 'ASSET', 'Fixed Assets', 0, 'USD', true, 'Patents, trademarks, domain names, and other intangibles'),
(gen_random_uuid(), '1210', 'Accumulated Amortization', 'ASSET', 'Fixed Assets', 0, 'USD', true, 'Contra-asset: accumulated amortization of intangible assets');


-- =====================================================
-- LIABILITIES (2030-2100)
-- =====================================================

-- Current Liabilities (HIGH PRIORITY)
INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '2030', 'Accrued Expenses', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Expenses incurred but not yet paid'),
(gen_random_uuid(), '2040', 'Accrued Payroll', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Wages earned by employees but not yet paid'),
(gen_random_uuid(), '2050', 'Payroll Taxes Payable', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Employer portion of payroll taxes due'),
(gen_random_uuid(), '2060', 'Sales Tax Payable', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Sales tax collected from customers'),
(gen_random_uuid(), '2070', 'Income Tax Payable', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Corporate income tax due'),
(gen_random_uuid(), '2080', 'Deferred Revenue', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'CRITICAL for SaaS: Revenue received but not yet earned'),
(gen_random_uuid(), '2090', 'Customer Deposits', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Advance payments from customers'),
(gen_random_uuid(), '2100', 'Short-term Notes Payable', 'LIABILITY', 'Current Liabilities', 0, 'USD', true, 'Notes payable due within 12 months');


-- =====================================================
-- REVENUE (4030-4080)
-- =====================================================

-- Tech-specific Revenue Streams
INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '4030', 'SaaS Recurring Revenue', 'REVENUE', 'Operating Revenue', 0, 'USD', true, 'Monthly/annual subscription revenue'),
(gen_random_uuid(), '4040', 'Professional Services Revenue', 'REVENUE', 'Operating Revenue', 0, 'USD', true, 'Consulting, implementation, and custom development'),
(gen_random_uuid(), '4050', 'License Revenue', 'REVENUE', 'Operating Revenue', 0, 'USD', true, 'One-time software license sales'),
(gen_random_uuid(), '4060', 'Setup & Onboarding Fees', 'REVENUE', 'Operating Revenue', 0, 'USD', true, 'Initial setup and customer onboarding fees'),
(gen_random_uuid(), '4070', 'Training Revenue', 'REVENUE', 'Operating Revenue', 0, 'USD', true, 'Customer training and education services');


-- =====================================================
-- EXPENSES - Technology & Infrastructure (5100-5140)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5100', 'Cloud Hosting & Infrastructure', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'AWS, Azure, GCP, and other cloud services'),
(gen_random_uuid(), '5110', 'Domain & Web Hosting', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Domain registration and web hosting fees'),
(gen_random_uuid(), '5120', 'Software Development Tools', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'GitHub, IDEs, development platforms'),
(gen_random_uuid(), '5130', 'Third-party APIs & Services', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'API subscriptions and integration services'),
(gen_random_uuid(), '5140', 'Data Storage & Backup', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Database hosting and backup services');


-- =====================================================
-- EXPENSES - People Costs (5150-5190)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5150', 'Payroll Taxes', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Employer portion of payroll taxes'),
(gen_random_uuid(), '5160', 'Employee Benefits', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Health insurance, 401k, and other benefits'),
(gen_random_uuid(), '5170', 'Contract Labor & Freelancers', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Independent contractors and freelance workers'),
(gen_random_uuid(), '5180', 'Recruitment & Hiring', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Job postings, recruiter fees, hiring costs'),
(gen_random_uuid(), '5190', 'Training & Development', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Employee training and professional development');


-- =====================================================
-- EXPENSES - Professional Services (5200-5220)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5200', 'Legal & Professional Fees', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Attorney fees, legal services'),
(gen_random_uuid(), '5210', 'Accounting & Bookkeeping', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'CPA, bookkeeping, and tax preparation'),
(gen_random_uuid(), '5220', 'Consulting Fees', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Business and technical consulting services');


-- =====================================================
-- EXPENSES - Operations (5230-5280)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5230', 'Bank & Merchant Fees', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Bank fees, wire transfers, merchant services'),
(gen_random_uuid(), '5240', 'Credit Card Processing Fees', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Stripe, PayPal, and other payment processing fees'),
(gen_random_uuid(), '5250', 'Internet & Telecommunications', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Internet, phone, and communication services'),
(gen_random_uuid(), '5260', 'Licenses & Permits', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Business licenses and regulatory permits'),
(gen_random_uuid(), '5270', 'Repairs & Maintenance', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Equipment and office repairs'),
(gen_random_uuid(), '5280', 'Printing & Postage', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Printing services and postage');


-- =====================================================
-- EXPENSES - Financial (5290-5320)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5290', 'Interest Expense', 'EXPENSE', 'Other Expenses', 0, 'USD', true, 'Interest on loans and credit facilities'),
(gen_random_uuid(), '5300', 'Bad Debt Expense', 'EXPENSE', 'Other Expenses', 0, 'USD', true, 'Uncollectible accounts receivable'),
(gen_random_uuid(), '5310', 'Amortization Expense', 'EXPENSE', 'Other Expenses', 0, 'USD', true, 'Amortization of intangible assets'),
(gen_random_uuid(), '5320', 'Miscellaneous Expense', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Other miscellaneous business expenses');


-- =====================================================
-- EXPENSES - Entertainment & Meals (5330-5370)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5330', 'Meals & Entertainment', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Business meals and entertainment (subject to 50% deduction limit)'),
(gen_random_uuid(), '5340', 'Team Events & Activities', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Team building, holiday parties, company outings'),
(gen_random_uuid(), '5350', 'Conferences & Events', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Conference fees, trade shows, networking events'),
(gen_random_uuid(), '5360', 'Books & Subscriptions', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Business books, magazines, industry publications'),
(gen_random_uuid(), '5370', 'Gifts & Client Appreciation', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Client gifts, thank you gifts (subject to $25 limit per person)');


-- =====================================================
-- EXPENSES - Transportation & Convenience (5380-5420)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5380', 'Parking & Tolls', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Parking fees, toll roads, parking meters'),
(gen_random_uuid(), '5390', 'Vehicle Fuel & Gas', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Gasoline and fuel for company vehicles'),
(gen_random_uuid(), '5400', 'Vehicle Maintenance & Repairs', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Car maintenance, oil changes, repairs'),
(gen_random_uuid(), '5410', 'Equipment Rental & Leasing', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Short-term equipment rentals'),
(gen_random_uuid(), '5420', 'Memberships & Dues', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Professional associations, chamber of commerce, coworking spaces');


-- =====================================================
-- EXPENSES - Additional Business (5430-5460)
-- =====================================================

INSERT INTO accounts (id, code, name, type, category, balance, currency, is_active, description)
VALUES
(gen_random_uuid(), '5430', 'Shipping & Delivery', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'FedEx, UPS, courier services'),
(gen_random_uuid(), '5440', 'Security & Monitoring', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Security systems, monitoring services, cybersecurity'),
(gen_random_uuid(), '5450', 'Cleaning & Janitorial', 'EXPENSE', 'Operating Expenses', 0, 'USD', true, 'Office cleaning services'),
(gen_random_uuid(), '5460', 'Charitable Contributions', 'EXPENSE', 'Other Expenses', 0, 'USD', true, 'Donations to qualified charitable organizations');


COMMIT;

-- Display summary of added accounts
SELECT
    type,
    COUNT(*) as new_accounts,
    MIN(code) as first_code,
    MAX(code) as last_code
FROM accounts
WHERE code IN (
    '1070', '1080', '1090', '1200', '1210',
    '2030', '2040', '2050', '2060', '2070', '2080', '2090', '2100',
    '4030', '4040', '4050', '4060', '4070',
    '5100', '5110', '5120', '5130', '5140',
    '5150', '5160', '5170', '5180', '5190',
    '5200', '5210', '5220',
    '5230', '5240', '5250', '5260', '5270', '5280',
    '5290', '5300', '5310', '5320',
    '5330', '5340', '5350', '5360', '5370',
    '5380', '5390', '5400', '5410', '5420',
    '5430', '5440', '5450', '5460'
)
GROUP BY type
ORDER BY MIN(code);

-- Show total account count
SELECT
    'Total Active Accounts' as metric,
    COUNT(*) as count
FROM accounts
WHERE is_active = true;
