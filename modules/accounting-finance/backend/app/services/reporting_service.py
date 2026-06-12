from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from datetime import datetime, timedelta
from typing import Dict, Any, List

from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionStatus


class ReportingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_financial_metrics(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Calculate key financial metrics"""
        # Get revenue accounts
        revenue_result = await self.db.execute(
            select(func.sum(Account.balance))
            .where(
                and_(
                    Account.type == AccountType.REVENUE,
                    Account.is_active == True
                )
            )
        )
        total_revenue = revenue_result.scalar() or 0

        # Get expense accounts
        expense_result = await self.db.execute(
            select(func.sum(Account.balance))
            .where(
                and_(
                    Account.type == AccountType.EXPENSE,
                    Account.is_active == True
                )
            )
        )
        total_expenses = abs(expense_result.scalar() or 0)

        # Get asset accounts for cash flow
        cash_result = await self.db.execute(
            select(func.sum(Account.balance))
            .where(
                and_(
                    Account.type == AccountType.ASSET,
                    Account.category.in_(["Cash", "Bank"]),
                    Account.is_active == True
                )
            )
        )
        cash_flow = cash_result.scalar() or 0

        # Calculate growth (simplified - compare to previous period)
        previous_start = start_date - (end_date - start_date)
        previous_end = start_date

        # Revenue growth (placeholder calculation)
        revenue_growth = 12.5  # This should be calculated from historical data

        # Expense growth (placeholder calculation)
        expense_growth = 8.3  # This should be calculated from historical data

        return {
            "totalRevenue": abs(total_revenue),
            "totalExpenses": total_expenses,
            "netIncome": abs(total_revenue) - total_expenses,
            "cashFlow": cash_flow,
            "revenueGrowth": revenue_growth,
            "expenseGrowth": expense_growth,
        }

    async def get_monthly_trends(self, months: int = 6) -> List[Dict[str, Any]]:
        """Get monthly revenue and expense trends"""
        trends = []
        current_date = datetime.utcnow()

        for i in range(months - 1, -1, -1):
            month_date = current_date - timedelta(days=30 * i)
            month_name = month_date.strftime("%b %Y")

            # In a real implementation, you would query transactions for each month
            # For now, we'll use placeholder data
            revenue = 50000 + (i * 5000)  # Increasing trend
            expenses = 30000 + (i * 3000)  # Increasing trend

            trends.append({
                "month": month_name,
                "revenue": revenue,
                "expenses": expenses,
                "profit": revenue - expenses,
            })

        return trends

    async def get_balance_sheet(self, as_of_date: datetime) -> Dict[str, Any]:
        """Generate balance sheet"""
        # Assets
        assets_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.ASSET,
                    Account.is_active == True
                )
            )
            .order_by(Account.code)
        )
        assets = assets_result.scalars().all()

        # Categorize assets
        current_assets = [a for a in assets if a.category in ["Cash", "Bank", "Receivables", "Inventory"]]
        fixed_assets = [a for a in assets if a.category not in ["Cash", "Bank", "Receivables", "Inventory"]]

        # Liabilities
        liabilities_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.LIABILITY,
                    Account.is_active == True
                )
            )
            .order_by(Account.code)
        )
        liabilities = liabilities_result.scalars().all()

        # Categorize liabilities
        current_liabilities = [l for l in liabilities if l.category in ["Accounts Payable", "Payroll", "Accrued Expenses"]]
        long_term_liabilities = [l for l in liabilities if l.category not in ["Accounts Payable", "Payroll", "Accrued Expenses"]]

        # Equity
        equity_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.EQUITY,
                    Account.is_active == True
                )
            )
            .order_by(Account.code)
        )
        equity_accounts = equity_result.scalars().all()

        # Calculate totals
        current_assets_total = sum(account.balance for account in current_assets)
        fixed_assets_total = sum(account.balance for account in fixed_assets)
        total_assets = current_assets_total + fixed_assets_total

        current_liabilities_total = sum(abs(account.balance) for account in current_liabilities)
        long_term_liabilities_total = sum(abs(account.balance) for account in long_term_liabilities)
        total_liabilities = current_liabilities_total + long_term_liabilities_total

        total_equity = sum(abs(account.balance) for account in equity_accounts)

        return {
            "as_of_date": as_of_date.isoformat(),
            "assets": {
                "current_assets": {
                    "accounts": [
                        {"name": f"{a.code} - {a.name}", "balance": a.balance}
                        for a in current_assets
                    ],
                    "total": current_assets_total
                },
                "fixed_assets": {
                    "accounts": [
                        {"name": f"{a.code} - {a.name}", "balance": a.balance}
                        for a in fixed_assets
                    ],
                    "total": fixed_assets_total
                },
                "total": total_assets
            },
            "liabilities": {
                "current_liabilities": {
                    "accounts": [
                        {"name": f"{l.code} - {l.name}", "balance": abs(l.balance)}
                        for l in current_liabilities
                    ],
                    "total": current_liabilities_total
                },
                "long_term_liabilities": {
                    "accounts": [
                        {"name": f"{l.code} - {l.name}", "balance": abs(l.balance)}
                        for l in long_term_liabilities
                    ],
                    "total": long_term_liabilities_total
                },
                "total": total_liabilities
            },
            "equity": {
                "accounts": [
                    {"name": f"{e.code} - {e.name}", "balance": abs(e.balance)}
                    for e in equity_accounts
                ],
                "total": total_equity
            },
            "total_liabilities_and_equity": total_liabilities + total_equity
        }

    async def get_income_statement(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate income statement (P&L)"""
        # Revenue
        revenue_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.REVENUE,
                    Account.is_active == True
                )
            )
            .order_by(Account.code)
        )
        revenue_accounts = revenue_result.scalars().all()

        # Expenses
        expense_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.EXPENSE,
                    Account.is_active == True
                )
            )
            .order_by(Account.code)
        )
        expense_accounts = expense_result.scalars().all()

        total_revenue = sum(abs(account.balance) for account in revenue_accounts)
        total_expenses = sum(abs(account.balance) for account in expense_accounts)
        gross_profit = total_revenue
        net_income = total_revenue - total_expenses

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "revenue": {
                "accounts": [
                    {"name": f"{a.code} - {a.name}", "amount": abs(a.balance)}
                    for a in revenue_accounts
                ],
                "total": total_revenue
            },
            "cost_of_goods_sold": {
                "accounts": [],
                "total": 0
            },
            "gross_profit": gross_profit,
            "operating_expenses": {
                "accounts": [
                    {"name": f"{e.code} - {e.name}", "amount": abs(e.balance)}
                    for e in expense_accounts
                ],
                "total": total_expenses
            },
            "operating_income": net_income,
            "other_income": {
                "accounts": [],
                "total": 0
            },
            "other_expenses": {
                "accounts": [],
                "total": 0
            },
            "net_income": net_income,
        }

    async def get_cash_flow(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Generate cash flow statement"""
        # Get cash and bank accounts
        cash_result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.ASSET,
                    Account.category.in_(["Cash", "Bank"]),
                    Account.is_active == True
                )
            )
        )
        cash_accounts = cash_result.scalars().all()

        # Get transactions affecting cash accounts
        cash_account_ids = [account.id for account in cash_accounts]

        transactions_result = await self.db.execute(
            select(Transaction)
            .where(
                and_(
                    or_(
                        Transaction.debit_account_id.in_(cash_account_ids),
                        Transaction.credit_account_id.in_(cash_account_ids)
                    ),
                    Transaction.status == TransactionStatus.POSTED,
                    Transaction.date >= start_date,
                    Transaction.date <= end_date
                )
            )
            .order_by(Transaction.date)
        )
        transactions = transactions_result.scalars().all()

        # Calculate cash flows
        operating_cash_flow = 0
        investing_cash_flow = 0
        financing_cash_flow = 0

        for transaction in transactions:
            # Simplified categorization
            # In a real system, you'd categorize based on account types
            if transaction.debit_account_id in cash_account_ids:
                operating_cash_flow += transaction.amount
            else:
                operating_cash_flow -= transaction.amount

        beginning_balance = sum(account.balance for account in cash_accounts) - operating_cash_flow
        ending_balance = sum(account.balance for account in cash_accounts)
        net_cash_flow = operating_cash_flow + investing_cash_flow + financing_cash_flow

        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "operating_activities": {
                "items": [
                    {"name": "Net Income", "amount": operating_cash_flow}
                ],
                "total": operating_cash_flow
            },
            "investing_activities": {
                "items": [],
                "total": investing_cash_flow
            },
            "financing_activities": {
                "items": [],
                "total": financing_cash_flow
            },
            "net_cash_flow": net_cash_flow,
            "beginning_cash": beginning_balance,
            "ending_cash": ending_balance,
        }
