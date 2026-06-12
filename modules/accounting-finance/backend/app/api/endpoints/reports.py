from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.core.database import get_db
from app.models.account import Account, AccountType
from app.models.transaction import Transaction, TransactionStatus
from app.services.reporting_service import ReportingService
from app.services.ai_insights import AIInsightsService

router = APIRouter()


@router.get("/reports/metrics")
async def get_financial_metrics(
    start_date: datetime = None,
    end_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Get key financial metrics"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    reporting_service = ReportingService(db)
    metrics = await reporting_service.get_financial_metrics(start_date, end_date)

    return metrics


@router.get("/reports/monthly-trends")
async def get_monthly_trends(
    months: int = 6,
    db: AsyncSession = Depends(get_db)
):
    """Get monthly revenue and expense trends"""
    reporting_service = ReportingService(db)
    trends = await reporting_service.get_monthly_trends(months)

    return trends


@router.get("/reports/account-balances")
async def get_account_balances(
    account_type: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Get current balances for all accounts"""
    query = select(Account).where(Account.is_active == True)

    if account_type:
        query = query.where(Account.type == account_type)

    result = await db.execute(query.order_by(Account.code))
    accounts = result.scalars().all()

    balances = [
        {
            "name": f"{account.code} - {account.name}",
            "value": abs(account.balance)
        }
        for account in accounts
        if account.balance != 0
    ]

    return balances[:10]  # Top 10 accounts


@router.get("/reports/balance-sheet")
async def get_balance_sheet(
    as_of_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Generate balance sheet report"""
    if not as_of_date:
        as_of_date = datetime.utcnow()

    reporting_service = ReportingService(db)
    balance_sheet = await reporting_service.get_balance_sheet(as_of_date)

    return balance_sheet


@router.get("/reports/income-statement")
async def get_income_statement(
    start_date: datetime = None,
    end_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Generate income statement (P&L) report"""
    if not start_date:
        start_date = datetime.utcnow().replace(day=1)
    if not end_date:
        end_date = datetime.utcnow()

    reporting_service = ReportingService(db)
    income_statement = await reporting_service.get_income_statement(start_date, end_date)

    return income_statement


@router.get("/reports/cash-flow")
async def get_cash_flow(
    start_date: datetime = None,
    end_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Generate cash flow statement"""
    if not start_date:
        start_date = datetime.utcnow() - timedelta(days=30)
    if not end_date:
        end_date = datetime.utcnow()

    reporting_service = ReportingService(db)
    cash_flow = await reporting_service.get_cash_flow(start_date, end_date)

    return cash_flow


@router.get("/reports/trial-balance")
async def get_trial_balance(
    as_of_date: datetime = None,
    db: AsyncSession = Depends(get_db)
):
    """Generate trial balance report"""
    if not as_of_date:
        as_of_date = datetime.utcnow()

    result = await db.execute(
        select(Account).where(Account.is_active == True).order_by(Account.code)
    )
    accounts = result.scalars().all()

    total_debits = sum(account.balance for account in accounts if account.balance > 0)
    total_credits = sum(abs(account.balance) for account in accounts if account.balance < 0)

    trial_balance = {
        "as_of_date": as_of_date.isoformat(),
        "accounts": [
            {
                "code": account.code,
                "name": account.name,
                "type": account.type.value,
                "debit": account.balance if account.balance > 0 else 0,
                "credit": abs(account.balance) if account.balance < 0 else 0,
            }
            for account in accounts
        ],
        "total_debits": total_debits,
        "total_credits": total_credits,
        "difference": total_debits - total_credits
    }

    return trial_balance


@router.get("/ai/insights")
async def get_ai_insights(
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered financial insights"""
    try:
        ai_service = AIInsightsService(db)
        insights = await ai_service.generate_insights()
        return insights
    except Exception as e:
        # Return empty insights if AI service fails
        return []


@router.get("/ai/forecast")
async def get_revenue_forecast(
    months: int = 6,
    db: AsyncSession = Depends(get_db)
):
    """Get AI-powered revenue forecast"""
    try:
        ai_service = AIInsightsService(db)
        forecast = await ai_service.forecast_revenue(months)
        return forecast
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate forecast: {str(e)}"
        )


@router.get("/ai/anomalies")
async def detect_anomalies(
    db: AsyncSession = Depends(get_db)
):
    """Detect unusual transactions or patterns"""
    try:
        ai_service = AIInsightsService(db)
        anomalies = await ai_service.detect_anomalies()
        return anomalies
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to detect anomalies: {str(e)}"
        )
