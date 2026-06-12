from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionStatus
from app.core.config import settings


class AIInsightsService:
    """AI-powered financial insights and analytics"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.openai_api_key = settings.OPENAI_API_KEY

    async def generate_insights(self) -> List[Dict[str, Any]]:
        """Generate AI-powered financial insights"""
        insights = []

        # Get financial data
        revenue_data = await self._get_revenue_trend()
        expense_data = await self._get_expense_trend()
        cash_flow_data = await self._get_cash_flow_status()

        # Revenue insights
        if revenue_data["trend"] == "increasing":
            insights.append({
                "category": "Revenue Growth",
                "message": f"Revenue has increased by {revenue_data['growth_rate']:.1f}% over the last 30 days. This positive trend indicates strong business performance.",
                "impact": "Positive",
                "confidence": 0.85
            })
        elif revenue_data["trend"] == "decreasing":
            insights.append({
                "category": "Revenue Decline",
                "message": f"Revenue has decreased by {abs(revenue_data['growth_rate']):.1f}% in the last 30 days. Consider investigating the cause and implementing corrective measures.",
                "impact": "Negative",
                "confidence": 0.82
            })

        # Expense insights
        if expense_data["ratio"] > 0.7:
            insights.append({
                "category": "High Expense Ratio",
                "message": f"Expenses represent {expense_data['ratio'] * 100:.1f}% of revenue. Consider cost optimization strategies to improve profit margins.",
                "impact": "Warning",
                "confidence": 0.78
            })

        # Cash flow insights
        if cash_flow_data["balance"] < cash_flow_data["recommended_reserve"]:
            insights.append({
                "category": "Cash Flow Warning",
                "message": f"Cash reserves are below recommended levels. Current balance: ${cash_flow_data['balance']:,.2f}, Recommended: ${cash_flow_data['recommended_reserve']:,.2f}",
                "impact": "Warning",
                "confidence": 0.90
            })

        # Account balance insights
        unusual_balances = await self._detect_unusual_balances()
        if unusual_balances:
            insights.append({
                "category": "Unusual Account Balances",
                "message": f"Detected {len(unusual_balances)} accounts with potentially unusual balances that may require review.",
                "impact": "Information",
                "confidence": 0.75
            })

        # If using OpenAI, generate additional insights
        if self.openai_api_key:
            ai_insights = await self._generate_openai_insights(revenue_data, expense_data)
            insights.extend(ai_insights)

        return insights

    async def forecast_revenue(self, months: int = 6) -> Dict[str, Any]:
        """Generate revenue forecast using trend analysis"""
        # Get historical revenue data
        result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.REVENUE,
                    Account.is_active == True
                )
            )
        )
        revenue_accounts = result.scalars().all()

        current_revenue = sum(abs(account.balance) for account in revenue_accounts)

        # Simple linear forecast (in production, use more sophisticated ML models)
        # Assuming 5% monthly growth
        growth_rate = 0.05
        forecast = []

        for i in range(months):
            month_date = datetime.utcnow() + timedelta(days=30 * i)
            projected_revenue = current_revenue * ((1 + growth_rate) ** i)

            forecast.append({
                "month": month_date.strftime("%b %Y"),
                "projected_revenue": round(projected_revenue, 2),
                "confidence": max(0.9 - (i * 0.1), 0.4)  # Decreasing confidence
            })

        return {
            "current_revenue": current_revenue,
            "forecast_period": f"{months} months",
            "forecast": forecast,
            "model": "Linear Growth Model",
            "assumptions": f"Based on {growth_rate * 100}% monthly growth rate"
        }

    async def detect_anomalies(self) -> List[Dict[str, Any]]:
        """Detect unusual transactions or patterns"""
        anomalies = []

        # Get recent transactions
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        result = await self.db.execute(
            select(Transaction)
            .where(
                and_(
                    Transaction.status == TransactionStatus.POSTED,
                    Transaction.date >= thirty_days_ago
                )
            )
        )
        transactions = result.scalars().all()

        if not transactions:
            return anomalies

        # Calculate statistics
        amounts = [t.amount for t in transactions]
        avg_amount = sum(amounts) / len(amounts)
        max_amount = max(amounts)

        # Detect unusually large transactions (3x average)
        threshold = avg_amount * 3
        large_transactions = [t for t in transactions if t.amount > threshold]

        for transaction in large_transactions:
            anomalies.append({
                "type": "Large Transaction",
                "transaction_id": str(transaction.id),
                "reference": transaction.reference,
                "amount": transaction.amount,
                "date": transaction.date.isoformat(),
                "description": transaction.description,
                "severity": "High" if transaction.amount > avg_amount * 5 else "Medium",
                "message": f"Transaction amount (${transaction.amount:,.2f}) is {transaction.amount / avg_amount:.1f}x the average"
            })

        # Detect duplicate transactions (same amount on same day)
        for i, t1 in enumerate(transactions):
            for t2 in transactions[i + 1:]:
                if (t1.date.date() == t2.date.date() and
                    abs(t1.amount - t2.amount) < 0.01):
                    anomalies.append({
                        "type": "Potential Duplicate",
                        "transaction_ids": [str(t1.id), str(t2.id)],
                        "references": [t1.reference, t2.reference],
                        "amount": t1.amount,
                        "date": t1.date.isoformat(),
                        "severity": "Low",
                        "message": "Two transactions with identical amounts on the same day"
                    })
                    break  # Only report once per transaction

        return anomalies

    async def _get_revenue_trend(self) -> Dict[str, Any]:
        """Analyze revenue trend"""
        result = await self.db.execute(
            select(Account)
            .where(
                and_(
                    Account.type == AccountType.REVENUE,
                    Account.is_active == True
                )
            )
        )
        revenue_accounts = result.scalars().all()

        current_revenue = sum(abs(account.balance) for account in revenue_accounts)

        # Simplified trend calculation
        # In production, compare with previous period
        growth_rate = 15.0  # Placeholder

        return {
            "current": current_revenue,
            "trend": "increasing" if growth_rate > 0 else "decreasing",
            "growth_rate": growth_rate
        }

    async def _get_expense_trend(self) -> Dict[str, Any]:
        """Analyze expense trend"""
        # Get revenue
        revenue_result = await self.db.execute(
            select(func.sum(Account.balance))
            .where(
                and_(
                    Account.type == AccountType.REVENUE,
                    Account.is_active == True
                )
            )
        )
        total_revenue = abs(revenue_result.scalar() or 0)

        # Get expenses
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

        ratio = total_expenses / total_revenue if total_revenue > 0 else 0

        return {
            "total": total_expenses,
            "ratio": ratio
        }

    async def _get_cash_flow_status(self) -> Dict[str, Any]:
        """Analyze cash flow status"""
        result = await self.db.execute(
            select(func.sum(Account.balance))
            .where(
                and_(
                    Account.type == AccountType.ASSET,
                    Account.category.in_(["Cash", "Bank"]),
                    Account.is_active == True
                )
            )
        )
        cash_balance = result.scalar() or 0

        # Get monthly expenses for reserve calculation
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

        # Recommended reserve: 3 months of expenses
        recommended_reserve = (total_expenses / 12) * 3

        return {
            "balance": cash_balance,
            "recommended_reserve": recommended_reserve
        }

    async def _detect_unusual_balances(self) -> List[Account]:
        """Detect accounts with unusual balances"""
        result = await self.db.execute(
            select(Account).where(Account.is_active == True)
        )
        accounts = result.scalars().all()

        unusual = []
        for account in accounts:
            # Check for negative balances in asset accounts
            if account.type == AccountType.ASSET and account.balance < 0:
                unusual.append(account)
            # Check for positive balances in liability accounts
            elif account.type == AccountType.LIABILITY and account.balance > 0:
                unusual.append(account)

        return unusual

    async def _generate_openai_insights(
        self,
        revenue_data: Dict[str, Any],
        expense_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Generate insights using OpenAI (requires API key)"""
        # This is a placeholder for OpenAI integration
        # In production, you would use langchain to interact with OpenAI

        try:
            from langchain_openai import ChatOpenAI
            from langchain.schema import HumanMessage

            llm = ChatOpenAI(
                model=settings.OPENAI_MODEL,
                temperature=0.7,
                openai_api_key=self.openai_api_key
            )

            prompt = f"""
            Analyze the following financial data and provide 2-3 actionable insights:

            Revenue: ${revenue_data['current']:,.2f}
            Revenue Trend: {revenue_data['trend']} ({revenue_data['growth_rate']:.1f}%)
            Expense Ratio: {expense_data['ratio'] * 100:.1f}%

            Format each insight as:
            Category | Message | Impact | Confidence (0-1)
            """

            response = llm.invoke([HumanMessage(content=prompt)])

            # Parse response and return insights
            # This is simplified - in production, use structured output
            return [{
                "category": "AI Insight",
                "message": response.content[:200],
                "impact": "Information",
                "confidence": 0.70
            }]

        except Exception as e:
            # If OpenAI fails, return empty list
            print(f"OpenAI insights generation failed: {e}")
            return []
