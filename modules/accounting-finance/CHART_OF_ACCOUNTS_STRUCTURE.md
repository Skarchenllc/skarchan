# Complete Chart of Accounts Structure

## Overview
Total Active Accounts: **84**
- Assets: 12 accounts
- Liabilities: 11 accounts
- Equity: 3 accounts
- Revenue: 8 accounts
- Expenses: 50 accounts

---

## 1. ASSETS (1000-1999)

### Cash (1000-1029)
- 1000 - Bank - Checking Account
- 1010 - Debit Card
- 1020 - Bank - Savings Account

### Current Assets (1030-1099)
- 1030 - Accounts Receivable
- 1040 - Inventory
- 1070 - Prepaid Expenses
- 1080 - Prepaid Software Licenses
- 1090 - Security Deposits

### Fixed Assets (1050-1999)
- 1050 - Equipment
- 1060 - Vehicles
- 1200 - Intangible Assets (patents, trademarks, domains)
- 1210 - Accumulated Amortization (contra-asset)

---

## 2. LIABILITIES (2000-2999)

### Current Liabilities (2000-2099)
- 2000 - Accounts Payable
- 2010 - Credit Card
- 2030 - Accrued Expenses
- 2040 - Accrued Payroll
- 2050 - Payroll Taxes Payable
- 2060 - Sales Tax Payable
- 2070 - Income Tax Payable
- 2080 - **Deferred Revenue** (critical for SaaS)
- 2090 - Customer Deposits
- 2100 - Short-term Notes Payable

### Long-term Liabilities (2020-2999)
- 2020 - Long-term Loan

---

## 3. EQUITY (3000-3999)

### Equity (3000-3099)
- 3000 - Owner's Capital
- 3010 - Owner's Drawing/Distributions
- 3020 - Retained Earnings

---

## 4. REVENUE (4000-4999)

### Operating Revenue (4000-4099)
- 4000 - Sales Revenue
- 4010 - Service Revenue
- 4030 - SaaS Recurring Revenue
- 4040 - Professional Services Revenue
- 4050 - License Revenue
- 4060 - Setup & Onboarding Fees
- 4070 - Training Revenue

### Other Revenue (4100-4999)
- 4020 - Interest Income

---

## 5. EXPENSES (5000-5999)

### Direct Costs (5000-5009)
- 5000 - Cost of Goods Sold

### Operating Expenses (5010-5499)

**Technology & Infrastructure (5010-5140)**
- 5010 - Software/Subscription Expense
- 5100 - Cloud Hosting & Infrastructure (AWS, Azure, GCP)
- 5110 - Domain & Web Hosting
- 5120 - Software Development Tools
- 5130 - Third-party APIs & Services
- 5140 - Data Storage & Backup

**People Costs (5020, 5150-5190)**
- 5020 - Salaries & Wages
- 5150 - Payroll Taxes
- 5160 - Employee Benefits
- 5170 - Contract Labor & Freelancers
- 5180 - Recruitment & Hiring
- 5190 - Training & Development

**Professional Services (5200-5220)**
- 5200 - Legal & Professional Fees
- 5210 - Accounting & Bookkeeping
- 5220 - Consulting Fees

**Operations (5030-5090, 5230-5280)**
- 5030 - Utilities
- 5040 - Rent Expense
- 5060 - Marketing & Advertising
- 5070 - Office Supplies
- 5080 - Insurance
- 5090 - Depreciation
- 5230 - Bank & Merchant Fees
- 5240 - Credit Card Processing Fees
- 5250 - Internet & Telecommunications
- 5260 - Licenses & Permits
- 5270 - Repairs & Maintenance
- 5280 - Printing & Postage

**Miscellaneous (5050, 5320)**
- 5050 - Travel Expense
- 5320 - Miscellaneous Expense

**Entertainment & Meals (5330-5370)**
- 5330 - Meals & Entertainment (50% deductible)
- 5340 - Team Events & Activities
- 5350 - Conferences & Events
- 5360 - Books & Subscriptions
- 5370 - Gifts & Client Appreciation ($25 limit)

**Transportation & Convenience (5380-5420)**
- 5380 - Parking & Tolls
- 5390 - Vehicle Fuel & Gas
- 5400 - Vehicle Maintenance & Repairs
- 5410 - Equipment Rental & Leasing
- 5420 - Memberships & Dues

**Facilities & Equipment (5430-5490)**
- 5430 - Shipping & Delivery
- 5440 - Security & Monitoring
- 5450 - Cleaning & Janitorial
- 5470 - Computer & IT Equipment
- 5480 - Computer & IT Repairs
- 5490 - Office Equipment & Furniture

### Other Expenses (5290-5310, 5460)
- 5290 - Interest Expense
- 5300 - Bad Debt Expense
- 5310 - Amortization Expense
- 5460 - Charitable Contributions

---

## Category Summary by Type

| Type | Categories |
|------|------------|
| **Assets** | Cash, Current Assets, Fixed Assets |
| **Liabilities** | Current Liabilities, Long-term Liabilities |
| **Equity** | Equity |
| **Revenue** | Operating Revenue, Other Revenue |
| **Expenses** | Direct Costs, Operating Expenses, Other Expenses |

---

## Best Practices

1. **Code Spacing**: 10-interval spacing allows adding accounts between existing ones without renumbering
2. **Categories**: All accounts properly categorized for financial statement organization
3. **SaaS-Ready**: Includes Deferred Revenue (2080) for subscription billing
4. **Tech-Optimized**: Cloud hosting, software tools, APIs properly tracked
5. **Tax-Compliant**: Separate tracking for meals (50% limit), gifts ($25 limit)
6. **Capitalization**: Small equipment expensed (5470-5490), large items capitalized (1050-1060)

---

## Notes

- Equipment under $2,500: Expense to 5470 (Computer & IT Equipment)
- Equipment over $2,500: Capitalize to 1050 (Equipment) and depreciate
- Software subscriptions: 5010 (monthly/annual SaaS services)
- One-time software licenses over $2,500: Capitalize to 1200 (Intangible Assets)
