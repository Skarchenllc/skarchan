-- Remove Transaction Type field entirely
-- This is not required by GAAP - the Chart of Accounts provides classification

BEGIN;

-- Step 1: Drop the type column from transactions table
ALTER TABLE transactions
DROP COLUMN IF EXISTS type;

-- Step 2: Drop the enum type (it's no longer needed)
DROP TYPE IF EXISTS transactiontype CASCADE;

-- Step 3: Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

COMMIT;

SELECT 'Transaction type field removed successfully! System now follows pure GAAP double-entry accounting.' as status;
