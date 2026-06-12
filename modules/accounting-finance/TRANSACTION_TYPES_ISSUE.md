# Transaction Types Issue

## ❌ Current Problem

The system currently has these transaction types:
- **debit**
- **credit**
- **transfer**
- **adjustment**

## 🚨 Why This is WRONG

In **double-entry accounting**, EVERY transaction has BOTH a debit AND a credit. That's why it's called "double-entry"!

The system already stores:
- `debit_account_id` - Which account is debited
- `credit_account_id` - Which account is credited
- `amount` - The transaction amount

So having "debit" and "credit" as **types** is redundant and confusing because:
1. Every transaction IS both a debit and a credit
2. You can't have a transaction that is ONLY a debit or ONLY a credit
3. The type field should describe the **business purpose**, not the accounting mechanism

## ✅ Correct Approach

The "type" field should categorize transactions by their **business purpose**:

### Recommended Transaction Types:

1. **JOURNAL_ENTRY** - General journal entries, manual adjustments
2. **PAYMENT** - Money paid out (vendor payments, expenses)
3. **RECEIPT** - Money received (customer payments, income)
4. **TRANSFER** - Moving money between accounts
5. **ADJUSTMENT** - Correcting/adjusting entries

### Alternative (Simpler):

Or just use:
1. **GENERAL** - General transactions
2. **PAYMENT** - Payments out
3. **RECEIPT** - Receipts in
4. **TRANSFER** - Inter-account transfers
5. **ADJUSTMENT** - Adjustments/corrections

## Examples of Proper Usage

### Example 1: Customer Payment
- **Type:** RECEIPT
- **Debit:** Bank Account (1000)
- **Credit:** Accounts Receivable (1030)
- **Amount:** $1,000
- **Description:** Payment received from Customer A

### Example 2: Rent Payment
- **Type:** PAYMENT
- **Debit:** Rent Expense (5040)
- **Credit:** Bank Account (1000)
- **Amount:** $2,000
- **Description:** Monthly office rent

### Example 3: Transfer Between Banks
- **Type:** TRANSFER
- **Debit:** Savings Account (1020)
- **Credit:** Checking Account (1000)
- **Amount:** $5,000
- **Description:** Transfer to savings

### Example 4: Correcting Entry
- **Type:** ADJUSTMENT
- **Debit:** Salaries & Wages (5020)
- **Credit:** Utilities (5030)
- **Amount:** $500
- **Description:** Correcting misclassified expense

## Recommendation

**OPTION 1: Keep it Simple (Recommended)**
- Change types to: GENERAL, PAYMENT, RECEIPT, TRANSFER, ADJUSTMENT
- Most intuitive for users
- Clearly indicates transaction purpose

**OPTION 2: More Detailed**
- Add more specific types like: PURCHASE, SALE, PAYROLL, DEPRECIATION, etc.
- More categorization but more complex

**OPTION 3: Remove Type Field Entirely**
- Since double-entry accounting is fully defined by debit/credit accounts
- Use account categories to determine transaction nature
- Simplest but loses some organizational value

My recommendation: **OPTION 1** - Simple but meaningful business categories.
