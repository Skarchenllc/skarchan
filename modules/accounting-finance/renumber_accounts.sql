-- Renumber Chart of Accounts to 10-interval sequences
-- Assets: 1000, 1010, 1020...
-- Liabilities: 2000, 2010, 2020...
-- Equity: 3000, 3010, 3020...
-- Revenue: 4000, 4010, 4020...
-- Expenses: 5000, 5010, 5020...

BEGIN;

-- First, let's see the current structure
SELECT 'Current Structure:' as info;
SELECT code, name, type FROM accounts WHERE is_active = true ORDER BY type, code;

-- Create temporary codes to avoid conflicts during renumbering
-- Add 'TEMP_' prefix to all codes temporarily
UPDATE accounts SET code = 'TEMP_' || code WHERE is_active = true;

-- ASSETS (1000 series) - 7 accounts
UPDATE accounts SET code = '1000' WHERE name = 'Bank - Checking Account' AND is_active = true;
UPDATE accounts SET code = '1010' WHERE name = 'Debit Card' AND is_active = true;
UPDATE accounts SET code = '1020' WHERE name = 'Bank - Savings Account' AND is_active = true;
UPDATE accounts SET code = '1030' WHERE name = 'Accounts Receivable' AND is_active = true;
UPDATE accounts SET code = '1040' WHERE name = 'Inventory' AND is_active = true;
UPDATE accounts SET code = '1050' WHERE name = 'Equipment' AND is_active = true;
UPDATE accounts SET code = '1060' WHERE name = 'Vehicles' AND is_active = true;

-- LIABILITIES (2000 series) - 3 accounts
UPDATE accounts SET code = '2000' WHERE name = 'Accounts Payable' AND is_active = true;
UPDATE accounts SET code = '2010' WHERE name = 'Credit Card' AND is_active = true;
UPDATE accounts SET code = '2020' WHERE name = 'Long-term Loan' AND is_active = true;

-- EQUITY (3000 series) - 3 accounts
UPDATE accounts SET code = '3000' WHERE name = 'Owner''s Capital' AND is_active = true;
UPDATE accounts SET code = '3010' WHERE name = 'Owner''s Drawing/Distributions' AND is_active = true;
UPDATE accounts SET code = '3020' WHERE name = 'Retained Earnings' AND is_active = true;

-- REVENUE (4000 series) - 3 accounts
UPDATE accounts SET code = '4000' WHERE name = 'Sales Revenue' AND is_active = true;
UPDATE accounts SET code = '4010' WHERE name = 'Service Revenue' AND is_active = true;
UPDATE accounts SET code = '4020' WHERE name = 'Interest Income' AND is_active = true;

-- EXPENSES (5000 series) - 10 accounts
UPDATE accounts SET code = '5000' WHERE name = 'Cost of Goods Sold' AND is_active = true;
UPDATE accounts SET code = '5010' WHERE name = 'Software/Subscription Expense' AND is_active = true;
UPDATE accounts SET code = '5020' WHERE name = 'Salaries & Wages' AND is_active = true;
UPDATE accounts SET code = '5030' WHERE name = 'Utilities' AND is_active = true;
UPDATE accounts SET code = '5040' WHERE name = 'Rent Expense' AND is_active = true;
UPDATE accounts SET code = '5050' WHERE name = 'Travel Expense' AND is_active = true;
UPDATE accounts SET code = '5060' WHERE name = 'Marketing & Advertising' AND is_active = true;
UPDATE accounts SET code = '5070' WHERE name = 'Office Supplies' AND is_active = true;
UPDATE accounts SET code = '5080' WHERE name = 'Insurance' AND is_active = true;
UPDATE accounts SET code = '5090' WHERE name = 'Depreciation' AND is_active = true;

-- Show new structure
SELECT 'New Structure:' as info;
SELECT code, name, type FROM accounts WHERE is_active = true ORDER BY code;

COMMIT;
