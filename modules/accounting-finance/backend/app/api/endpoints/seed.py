from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from decimal import Decimal
import uuid

from app.core.database import get_db
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionStatus

router = APIRouter()


@router.post("/seed-data")
async def seed_data(db: AsyncSession = Depends(get_db)):
    """Seed the database with sample data for demonstration"""

    # Check if data already exists
    result = await db.execute(select(Account))
    existing_accounts = result.scalars().all()

    if existing_accounts:
        raise HTTPException(
            status_code=400,
            detail="Database already contains data. Clear it first before seeding."
        )

    # Create Accounts
    accounts_data = [
        # Assets
        {"code": "1000", "name": "Cash on Hand", "type": AccountType.ASSET, "category": "Cash", "balance": 50000, "currency": "USD"},
        {"code": "1010", "name": "Bank - Checking Account", "type": AccountType.ASSET, "category": "Bank", "balance": 250000, "currency": "USD"},
        {"code": "1020", "name": "Bank - Savings Account", "type": AccountType.ASSET, "category": "Bank", "balance": 100000, "currency": "USD"},
        {"code": "1100", "name": "Accounts Receivable", "type": AccountType.ASSET, "category": "Current Assets", "balance": 75000, "currency": "USD"},
        {"code": "1200", "name": "Inventory", "type": AccountType.ASSET, "category": "Current Assets", "balance": 150000, "currency": "USD"},
        {"code": "1500", "name": "Equipment", "type": AccountType.ASSET, "category": "Fixed Assets", "balance": 200000, "currency": "USD"},
        {"code": "1510", "name": "Vehicles", "type": AccountType.ASSET, "category": "Fixed Assets", "balance": 80000, "currency": "USD"},

        # Liabilities
        {"code": "2000", "name": "Accounts Payable", "type": AccountType.LIABILITY, "category": "Current Liabilities", "balance": -45000, "currency": "USD"},
        {"code": "2100", "name": "Credit Card", "type": AccountType.LIABILITY, "category": "Current Liabilities", "balance": -12000, "currency": "USD"},
        {"code": "2500", "name": "Long-term Loan", "type": AccountType.LIABILITY, "category": "Long-term Liabilities", "balance": -150000, "currency": "USD"},

        # Equity
        {"code": "3000", "name": "Owner's Capital", "type": AccountType.EQUITY, "category": "Equity", "balance": -500000, "currency": "USD"},
        {"code": "3100", "name": "Retained Earnings", "type": AccountType.EQUITY, "category": "Equity", "balance": -98000, "currency": "USD"},

        # Revenue
        {"code": "4000", "name": "Sales Revenue", "type": AccountType.REVENUE, "category": "Operating Revenue", "balance": -350000, "currency": "USD"},
        {"code": "4100", "name": "Service Revenue", "type": AccountType.REVENUE, "category": "Operating Revenue", "balance": -120000, "currency": "USD"},
        {"code": "4200", "name": "Interest Income", "type": AccountType.REVENUE, "category": "Other Revenue", "balance": -2000, "currency": "USD"},

        # Expenses
        {"code": "5000", "name": "Cost of Goods Sold", "type": AccountType.EXPENSE, "category": "Direct Costs", "balance": 180000, "currency": "USD"},
        {"code": "6000", "name": "Salaries & Wages", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 120000, "currency": "USD"},
        {"code": "6100", "name": "Rent Expense", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 36000, "currency": "USD"},
        {"code": "6200", "name": "Utilities", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 12000, "currency": "USD"},
        {"code": "6300", "name": "Marketing & Advertising", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 25000, "currency": "USD"},
        {"code": "6400", "name": "Office Supplies", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 8000, "currency": "USD"},
        {"code": "6500", "name": "Insurance", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 15000, "currency": "USD"},
        {"code": "6600", "name": "Depreciation", "type": AccountType.EXPENSE, "category": "Operating Expenses", "balance": 20000, "currency": "USD"},
    ]

    created_accounts = {}
    for account_data in accounts_data:
        account = Account(
            id=uuid.uuid4(),
            **account_data,
            is_active=True
        )
        db.add(account)
        created_accounts[account_data["code"]] = account

    await db.flush()

    # Create Sample Transactions
    base_date = datetime.utcnow() - timedelta(days=60)

    transactions_data = [
        # Month 1
        {
            "date": base_date + timedelta(days=1),
            "reference": "TXN-20240101-0001",
            "description": "Initial capital investment from owner",
            "type": "credit",
            "amount": 500000,
            "debit_account_code": "1010",  # Bank
            "credit_account_code": "3000",  # Owner's Capital
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=2),
            "reference": "TXN-20240102-0001",
            "description": "Purchase of office equipment",
            "type": "debit",
            "amount": 50000,
            "debit_account_code": "1500",  # Equipment
            "credit_account_code": "1010",  # Bank
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=5),
            "reference": "TXN-20240105-0001",
            "description": "Purchase of vehicles for business use",
            "type": "debit",
            "amount": 80000,
            "debit_account_code": "1510",  # Vehicles
            "credit_account_code": "2500",  # Long-term Loan
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=10),
            "reference": "TXN-20240110-0001",
            "description": "Inventory purchase for resale",
            "type": "debit",
            "amount": 100000,
            "debit_account_code": "1200",  # Inventory
            "credit_account_code": "2000",  # Accounts Payable
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=15),
            "reference": "TXN-20240115-0001",
            "description": "Sales revenue - January Week 2",
            "type": "credit",
            "amount": 85000,
            "debit_account_code": "1100",  # Accounts Receivable
            "credit_account_code": "4000",  # Sales Revenue
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=16),
            "reference": "TXN-20240116-0001",
            "description": "Cost of goods sold - January Week 2",
            "type": "debit",
            "amount": 45000,
            "debit_account_code": "5000",  # COGS
            "credit_account_code": "1200",  # Inventory
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=20),
            "reference": "TXN-20240120-0001",
            "description": "Monthly rent payment",
            "type": "debit",
            "amount": 3000,
            "debit_account_code": "6100",  # Rent Expense
            "credit_account_code": "1010",  # Bank
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=25),
            "reference": "TXN-20240125-0001",
            "description": "Employee salaries - January",
            "type": "debit",
            "amount": 40000,
            "debit_account_code": "6000",  # Salaries
            "credit_account_code": "1010",  # Bank
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=30),
            "reference": "TXN-20240130-0001",
            "description": "Service revenue - January",
            "type": "credit",
            "amount": 35000,
            "debit_account_code": "1010",  # Bank
            "credit_account_code": "4100",  # Service Revenue
            "status": TransactionStatus.POSTED
        },

        # Month 2
        {
            "date": base_date + timedelta(days=35),
            "reference": "TXN-20240205-0001",
            "description": "Marketing campaign payment",
            "type": "debit",
            "amount": 15000,
            "debit_account_code": "6300",  # Marketing
            "credit_account_code": "2100",  # Credit Card
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=40),
            "reference": "TXN-20240210-0001",
            "description": "Sales revenue - February Week 2",
            "type": "credit",
            "amount": 95000,
            "debit_account_code": "1100",  # Accounts Receivable
            "credit_account_code": "4000",  # Sales Revenue
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=41),
            "reference": "TXN-20240211-0001",
            "description": "Cost of goods sold - February Week 2",
            "type": "debit",
            "amount": 50000,
            "debit_account_code": "5000",  # COGS
            "credit_account_code": "1200",  # Inventory
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=45),
            "reference": "TXN-20240215-0001",
            "description": "Utilities payment",
            "type": "debit",
            "amount": 1200,
            "debit_account_code": "6200",  # Utilities
            "credit_account_code": "1010",  # Bank
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=50),
            "reference": "TXN-20240220-0001",
            "description": "Office supplies purchase",
            "type": "debit",
            "amount": 2500,
            "debit_account_code": "6400",  # Office Supplies
            "credit_account_code": "2100",  # Credit Card
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=55),
            "reference": "TXN-20240225-0001",
            "description": "Employee salaries - February",
            "type": "debit",
            "amount": 40000,
            "debit_account_code": "6000",  # Salaries
            "credit_account_code": "1010",  # Bank
            "status": TransactionStatus.POSTED
        },
        {
            "date": base_date + timedelta(days=60),
            "reference": "TXN-20240228-0001",
            "description": "Service revenue - February",
            "type": "credit",
            "amount": 42000,
            "debit_account_code": "1010",  # Bank
            "credit_account_code": "4100",  # Service Revenue
            "status": TransactionStatus.POSTED
        },
    ]

    for txn_data in transactions_data:
        debit_acc = created_accounts[txn_data["debit_account_code"]]
        credit_acc = created_accounts[txn_data["credit_account_code"]]

        transaction = Transaction(
            id=uuid.uuid4(),
            date=txn_data["date"],
            reference=txn_data["reference"],
            description=txn_data["description"],
            amount=txn_data["amount"],
            debit_account_id=debit_acc.id,
            credit_account_id=credit_acc.id,
            status=txn_data["status"]
        )
        db.add(transaction)

    await db.commit()

    # Count created records
    accounts_count = len(accounts_data)
    transactions_count = len(transactions_data)

    return {
        "message": "Sample data seeded successfully",
        "accounts_created": accounts_count,
        "transactions_created": transactions_count
    }


@router.delete("/clear-data")
async def clear_data(db: AsyncSession = Depends(get_db)):
    """Clear all data from the database"""

    # Delete all transactions first (foreign key constraint)
    transactions_result = await db.execute(select(Transaction))
    transactions = transactions_result.scalars().all()
    for transaction in transactions:
        await db.delete(transaction)

    # Delete all accounts
    accounts_result = await db.execute(select(Account))
    accounts = accounts_result.scalars().all()
    for account in accounts:
        await db.delete(account)

    await db.commit()

    return {
        "message": "All data cleared successfully",
        "transactions_deleted": len(transactions),
        "accounts_deleted": len(accounts)
    }
