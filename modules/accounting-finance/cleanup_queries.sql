-- SQL Queries for Manual Cleanup
-- Execute these directly in the database if needed

-- ===================================
-- CHECK CURRENT DATA
-- ===================================

-- Count all records
SELECT
    'Accounts (Active)' as type,
    COUNT(*) as count
FROM accounts
WHERE is_active = true
UNION ALL
SELECT
    'Accounts (Inactive)' as type,
    COUNT(*)
FROM accounts
WHERE is_active = false
UNION ALL
SELECT
    'Transactions (' || status || ')' as type,
    COUNT(*)
FROM transactions
GROUP BY status;


-- ===================================
-- CLEANUP OPTIONS (uncomment to use)
-- ===================================

-- Option 1: Delete ONLY inactive accounts
-- DELETE FROM accounts WHERE is_active = false;

-- Option 2: Soft delete all accounts (mark as inactive)
-- UPDATE accounts SET is_active = false;

-- Option 3: Hard delete ALL accounts
-- DELETE FROM accounts;

-- Option 4: Delete ALL transactions
-- DELETE FROM transactions;

-- Option 5: Delete specific transactions by status
-- DELETE FROM transactions WHERE status = 'PENDING';
-- DELETE FROM transactions WHERE status = 'POSTED';

-- Option 6: Delete transactions in a date range
-- DELETE FROM transactions WHERE date BETWEEN '2024-01-01' AND '2024-12-31';

-- Option 7: NUCLEAR OPTION - Delete everything
-- DELETE FROM transactions;
-- DELETE FROM accounts;


-- ===================================
-- RESET AUTO-INCREMENT SEQUENCES
-- (Run after deleting data)
-- ===================================

-- This is not needed for UUID-based IDs
-- But if you want to clean up other tables with sequences:
-- ALTER SEQUENCE your_sequence_name RESTART WITH 1;
