from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Dict, Any
from datetime import datetime, date
import uuid
import json

from app.core.database import get_db
from app.models.employee import Employee
from pydantic import BaseModel

router = APIRouter()


# Pydantic models
class PayslipCreate(BaseModel):
    employee_id: str
    gross_pay: float
    net_pay: float
    total_deductions: float
    total_taxes: float
    overtime_hours: float = 0
    overtime_pay: float = 0
    bonus_amount: float = 0
    components: Dict[str, float] = {}


class PayrollRunCreate(BaseModel):
    pay_period_start: str
    pay_period_end: str
    pay_date: str
    total_employees: int
    total_gross_pay: float
    total_net_pay: float
    total_taxes: float
    status: str = "completed"
    payslips: List[PayslipCreate]


class PayrollRunResponse(BaseModel):
    payroll_run_id: str
    payroll_number: str
    pay_period_start: str
    pay_period_end: str
    pay_date: str
    total_employees: int
    total_gross_pay: float
    total_net_pay: float
    total_taxes: float
    payslips_created: int
    status: str
    message: str


@router.post("/payroll-runs", response_model=PayrollRunResponse)
async def create_payroll_run(
    payroll_run: PayrollRunCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new payroll run with payslips for all employees
    """
    try:
        # Generate unique payroll number
        payroll_number = f"PR-{datetime.now().strftime('%Y%m%d-%H%M%S')}"

        # Convert date strings to date objects
        pay_period_start_date = datetime.strptime(payroll_run.pay_period_start, "%Y-%m-%d").date()
        pay_period_end_date = datetime.strptime(payroll_run.pay_period_end, "%Y-%m-%d").date()
        pay_date_obj = datetime.strptime(payroll_run.pay_date, "%Y-%m-%d").date()

        # Create payroll run record
        payroll_run_id = uuid.uuid4()

        await db.execute(
            text("""
            INSERT INTO payroll_runs (
                id, payroll_number, pay_period_start, pay_period_end, pay_date,
                status, total_gross_pay, total_deductions, total_net_pay, employee_count,
                created_at, updated_at
            ) VALUES (
                :id, :payroll_number, :pay_period_start, :pay_period_end, :pay_date,
                :status, :total_gross_pay, :total_deductions, :total_net_pay, :employee_count,
                NOW(), NOW()
            )
            """),
            {
                "id": payroll_run_id,
                "payroll_number": payroll_number,
                "pay_period_start": pay_period_start_date,
                "pay_period_end": pay_period_end_date,
                "pay_date": pay_date_obj,
                "status": payroll_run.status,
                "total_gross_pay": payroll_run.total_gross_pay,
                "total_deductions": sum(p.total_deductions for p in payroll_run.payslips),
                "total_net_pay": payroll_run.total_net_pay,
                "employee_count": payroll_run.total_employees
            }
        )

        # Create payslip records for each employee
        payslips_created = 0
        for payslip_data in payroll_run.payslips:
            payslip_id = uuid.uuid4()

            # Prepare earnings, taxes, and deductions as JSONB
            earnings = {
                "gross_pay": payslip_data.gross_pay,
                "overtime_pay": payslip_data.overtime_pay,
                "bonus_amount": payslip_data.bonus_amount,
            }

            # Extract tax components from payroll components
            taxes = {}
            deductions = {}
            for code, value in payslip_data.components.items():
                if code in ['FIT', 'SIT', 'FICA_SS', 'MEDICARE']:
                    taxes[code] = value
                elif code in ['401K', 'HEALTH']:
                    deductions[code] = value

            await db.execute(
                text("""
                INSERT INTO payslips (
                    id, payroll_run_id, employee_id, pay_period_start, pay_period_end, pay_date,
                    overtime_hours, earnings, gross_pay, taxes, total_taxes,
                    deductions, total_deductions, net_pay, created_at, updated_at
                ) VALUES (
                    :id, :payroll_run_id, :employee_id, :pay_period_start, :pay_period_end, :pay_date,
                    :overtime_hours, :earnings, :gross_pay, :taxes, :total_taxes,
                    :deductions, :total_deductions, :net_pay, NOW(), NOW()
                )
                """),
                {
                    "id": payslip_id,
                    "payroll_run_id": payroll_run_id,
                    "employee_id": uuid.UUID(payslip_data.employee_id),
                    "pay_period_start": pay_period_start_date,
                    "pay_period_end": pay_period_end_date,
                    "pay_date": pay_date_obj,
                    "overtime_hours": payslip_data.overtime_hours,
                    "earnings": json.dumps(earnings),
                    "gross_pay": payslip_data.gross_pay,
                    "taxes": json.dumps(taxes),
                    "total_taxes": payslip_data.total_taxes,
                    "deductions": json.dumps(deductions),
                    "total_deductions": payslip_data.total_deductions,
                    "net_pay": payslip_data.net_pay
                }
            )
            payslips_created += 1

        await db.commit()

        return PayrollRunResponse(
            payroll_run_id=str(payroll_run_id),
            payroll_number=payroll_number,
            pay_period_start=payroll_run.pay_period_start,
            pay_period_end=payroll_run.pay_period_end,
            pay_date=payroll_run.pay_date,
            total_employees=payroll_run.total_employees,
            total_gross_pay=payroll_run.total_gross_pay,
            total_net_pay=payroll_run.total_net_pay,
            total_taxes=payroll_run.total_taxes,
            payslips_created=payslips_created,
            status=payroll_run.status,
            message=f"Payroll run created successfully with {payslips_created} payslips"
        )

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payroll run: {str(e)}")


@router.get("/payslips")
async def get_payslips(
    employee_id: str = None,
    payroll_run_id: str = None,
    pay_period_start: str = None,
    pay_period_end: str = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get payslips filtered by employee_id, payroll_run_id, or pay period dates
    """
    try:
        query = "SELECT * FROM payslips WHERE 1=1"
        params = {}

        if employee_id:
            query += " AND employee_id = :employee_id"
            params["employee_id"] = uuid.UUID(employee_id)

        if payroll_run_id:
            query += " AND payroll_run_id = :payroll_run_id"
            params["payroll_run_id"] = uuid.UUID(payroll_run_id)

        if pay_period_start:
            query += " AND pay_period_start = :pay_period_start"
            params["pay_period_start"] = datetime.strptime(pay_period_start, "%Y-%m-%d").date()

        if pay_period_end:
            query += " AND pay_period_end = :pay_period_end"
            params["pay_period_end"] = datetime.strptime(pay_period_end, "%Y-%m-%d").date()

        query += " ORDER BY pay_period_end DESC"

        result = await db.execute(text(query), params)
        rows = result.fetchall()

        payslips = []
        for row in rows:
            # Parse JSONB fields - handle both dict and array formats
            earnings_raw = row[9] if row[9] else {}
            taxes = row[11] if row[11] else {}
            deductions = row[13] if row[13] else {}
            employer_contributions = row[15] if row[15] else {}

            # Handle earnings - can be array or object
            if isinstance(earnings_raw, list):
                # Array format: extract values from first element
                earnings = earnings_raw[0] if earnings_raw else {}
                overtime_pay = 0
                bonus_amount = 0
            elif isinstance(earnings_raw, dict):
                # Object format: use directly
                earnings = earnings_raw
                overtime_pay = earnings.get("overtime_pay", 0)
                bonus_amount = earnings.get("bonus_amount", 0)
            else:
                earnings = {}
                overtime_pay = 0
                bonus_amount = 0

            payslips.append({
                "id": str(row[0]),
                "payroll_run_id": str(row[1]),
                "employee_id": str(row[2]),
                "pay_period_start": row[3].isoformat() if row[3] else None,
                "pay_period_end": row[4].isoformat() if row[4] else None,
                "pay_date": row[5].isoformat() if row[5] else None,
                "regular_hours": row[6],
                "overtime_hours": row[7],
                "total_hours": row[8],
                "earnings": earnings,
                "gross_pay": row[10],
                "taxes": taxes,
                "total_taxes": row[12],
                "deductions": deductions,
                "total_deductions": row[14],
                "employer_contributions": employer_contributions,
                "total_employer_cost": row[16],
                "net_pay": row[17],
                "ytd_gross": row[18],
                "ytd_taxes": row[19],
                "ytd_deductions": row[20],
                "ytd_net": row[21],
                "payment_method": row[22],
                "bank_account_last4": row[23],
                "check_number": row[24],
                "is_void": row[25],
                "void_reason": row[26],
                "voided_at": row[27].isoformat() if row[27] else None,
                "voided_by": row[28],
                "notes": row[29],
                "created_at": row[30].isoformat() if row[30] else None,
                "updated_at": row[31].isoformat() if row[31] else None,
                "overtime_pay": overtime_pay,
                "bonus_amount": bonus_amount,
            })

        return payslips

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payslips: {str(e)}")
