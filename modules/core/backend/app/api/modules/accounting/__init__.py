"""
Accounting & Finance Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import chart_of_accounts
from . import bank_accounts
from . import bank_reconciliations
from . import bank_statements
from . import bank_statement_transactions
from . import reconciliation_items
from . import bills
from . import bill_payments
from . import budgets
from . import budget_lines
from . import budget_revisions
from . import budget_alerts
from . import budget_scenarios
from . import budget_templates
from . import currencies
from . import exchange_rates
from . import currency_exchange_transactions
from . import unrealized_gain_loss
from . import accounting_customers
from . import fixed_assets
from . import invoices
from . import invoice_payments
from . import payment_reminders
from . import payroll_employees
from . import salary_structures
from . import tax_configurations
from . import payroll_runs
from . import payslips
from . import payroll_journals
from . import time_entries
from . import accounting_periods
from . import period_closings
from . import year_end_closings
from . import period_adjustments
from . import purchase_orders
from . import po_receipts
from . import batch_payments
from . import tax_rates
from . import tax_settings
from . import tax_payments
from . import transactions
from . import vendors
from . import payment_methods

router = APIRouter()

router.include_router(chart_of_accounts.router, prefix="/chart-of-accounts", tags=["Accounting & Finance - Chart of Accounts"])
router.include_router(bank_accounts.router, prefix="/bank-accounts", tags=["Accounting & Finance - Bank Accounts"])
router.include_router(bank_reconciliations.router, prefix="/bank-reconciliations", tags=["Accounting & Finance - Bank Reconciliations"])
router.include_router(bank_statements.router, prefix="/bank-statements", tags=["Accounting & Finance - Bank Statements"])
router.include_router(bank_statement_transactions.router, prefix="/bank-statement-transactions", tags=["Accounting & Finance - Bank Transactions"])
router.include_router(reconciliation_items.router, prefix="/reconciliation-items", tags=["Accounting & Finance - Reconciliation Items"])
router.include_router(bills.router, prefix="/bills", tags=["Accounting & Finance - Vendor Bills"])
router.include_router(bill_payments.router, prefix="/bill-payments", tags=["Accounting & Finance - Bill Payments"])
router.include_router(budgets.router, prefix="/budgets", tags=["Accounting & Finance - Budgets"])
router.include_router(budget_lines.router, prefix="/budget-lines", tags=["Accounting & Finance - Budget Lines"])
router.include_router(budget_revisions.router, prefix="/budget-revisions", tags=["Accounting & Finance - Budget Revisions"])
router.include_router(budget_alerts.router, prefix="/budget-alerts", tags=["Accounting & Finance - Budget Alerts"])
router.include_router(budget_scenarios.router, prefix="/budget-scenarios", tags=["Accounting & Finance - Budget Scenarios"])
router.include_router(budget_templates.router, prefix="/budget-templates", tags=["Accounting & Finance - Budget Templates"])
router.include_router(currencies.router, prefix="/currencies", tags=["Accounting & Finance - Currencies"])
router.include_router(exchange_rates.router, prefix="/exchange-rates", tags=["Accounting & Finance - Exchange Rates"])
router.include_router(currency_exchange_transactions.router, prefix="/currency-exchange-transactions", tags=["Accounting & Finance - Currency Exchange Transactions"])
router.include_router(unrealized_gain_loss.router, prefix="/unrealized-gain-loss", tags=["Accounting & Finance - Unrealized FX Gains/Losses"])
router.include_router(accounting_customers.router, prefix="/accounting-customers", tags=["Accounting & Finance - Customers (AR)"])
router.include_router(fixed_assets.router, prefix="/fixed-assets", tags=["Accounting & Finance - Fixed Assets"])
router.include_router(invoices.router, prefix="/invoices", tags=["Accounting & Finance - Customer Invoices"])
router.include_router(invoice_payments.router, prefix="/invoice-payments", tags=["Accounting & Finance - Invoice Payments"])
router.include_router(payment_reminders.router, prefix="/payment-reminders", tags=["Accounting & Finance - Payment Reminders"])
router.include_router(payroll_employees.router, prefix="/payroll-employees", tags=["Accounting & Finance - Employees (Payroll)"])
router.include_router(salary_structures.router, prefix="/salary-structures", tags=["Accounting & Finance - Salary Structures"])
router.include_router(tax_configurations.router, prefix="/tax-configurations", tags=["Accounting & Finance - Tax Configurations"])
router.include_router(payroll_runs.router, prefix="/payroll-runs", tags=["Accounting & Finance - Payroll Runs"])
router.include_router(payslips.router, prefix="/payslips", tags=["Accounting & Finance - Payslips"])
router.include_router(payroll_journals.router, prefix="/payroll-journals", tags=["Accounting & Finance - Payroll Journals"])
router.include_router(time_entries.router, prefix="/time-entries", tags=["Accounting & Finance - Time Entries"])
router.include_router(accounting_periods.router, prefix="/accounting-periods", tags=["Accounting & Finance - Accounting Periods"])
router.include_router(period_closings.router, prefix="/period-closings", tags=["Accounting & Finance - Period Closings"])
router.include_router(year_end_closings.router, prefix="/year-end-closings", tags=["Accounting & Finance - Year-End Closings"])
router.include_router(period_adjustments.router, prefix="/period-adjustments", tags=["Accounting & Finance - Period Adjustments"])
router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["Accounting & Finance - Purchase Orders"])
router.include_router(po_receipts.router, prefix="/po-receipts", tags=["Accounting & Finance - Goods Receipts"])
router.include_router(batch_payments.router, prefix="/batch-payments", tags=["Accounting & Finance - Batch Payments"])
router.include_router(tax_rates.router, prefix="/tax-rates", tags=["Accounting & Finance - Tax Rates"])
router.include_router(tax_settings.router, prefix="/tax-settings", tags=["Accounting & Finance - Tax Settings"])
router.include_router(tax_payments.router, prefix="/tax-payments", tags=["Accounting & Finance - Tax Payments"])
router.include_router(transactions.router, prefix="/transactions", tags=["Accounting & Finance - GL Transactions"])
router.include_router(vendors.router, prefix="/vendors", tags=["Accounting & Finance - Vendors"])
router.include_router(payment_methods.router, prefix="/payment-methods", tags=["Accounting & Finance - Payment Methods"])

# Moved from Administration:
from app.api.modules.entity_crud_template import create_entity_router
router.include_router(create_entity_router("accounting", "assets"),        prefix="/assets",        tags=["Accounting & Finance - Assets"])
router.include_router(create_entity_router("accounting", "subscriptions"), prefix="/subscriptions", tags=["Accounting & Finance - Subscriptions"])
