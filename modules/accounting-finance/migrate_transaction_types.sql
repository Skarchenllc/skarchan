-- Migrate Transaction Types from old (debit/credit) to new (general/payment/receipt/transfer/adjustment)
-- This script safely updates the database enum type

BEGIN;

-- Step 1: Convert the type column to text temporarily
ALTER TABLE transactions
ALTER COLUMN type TYPE TEXT;

-- Step 2: Migrate existing transaction data
-- Map old types to new types:
-- CREDIT -> RECEIPT (money coming in)
-- DEBIT -> PAYMENT (money going out)
-- TRANSFER -> TRANSFER (stays same)
-- ADJUSTMENT -> ADJUSTMENT (stays same)

UPDATE transactions SET type = 'receipt' WHERE type = 'CREDIT' OR type = 'credit';
UPDATE transactions SET type = 'payment' WHERE type = 'DEBIT' OR type = 'debit';
UPDATE transactions SET type = 'transfer' WHERE type = 'TRANSFER' OR type = 'transfer';
UPDATE transactions SET type = 'adjustment' WHERE type = 'ADJUSTMENT' OR type = 'adjustment';
UPDATE transactions SET type = 'general' WHERE type NOT IN ('receipt', 'payment', 'transfer', 'adjustment');

-- Step 3: Drop the old enum type
DROP TYPE IF EXISTS transactiontype CASCADE;

-- Step 4: Create the new enum type
CREATE TYPE transactiontype AS ENUM ('general', 'payment', 'receipt', 'transfer', 'adjustment');

-- Step 5: Convert the column back to the new enum type
ALTER TABLE transactions
ALTER COLUMN type TYPE transactiontype USING type::transactiontype;

-- Step 6: Verify the migration
SELECT type, COUNT(*) as count
FROM transactions
GROUP BY type
ORDER BY type;

COMMIT;

SELECT 'Migration completed successfully!' as status;
