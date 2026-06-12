from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, text
from typing import List, Optional
from datetime import datetime, date
from uuid import UUID
import secrets
import string
import hashlib

from app.core.database import get_db
from app.models.employee import (
    Employee,
    Department,
    Position,
    LeaveRequest,
    LeaveBalance,
    PerformanceReview,
    AttendanceRecord,
    EmploymentStatus,
    EmploymentType,
    LeaveStatus,
)
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse,
    PositionCreate,
    PositionUpdate,
    PositionResponse,
    LeaveRequestCreate,
    LeaveRequestUpdate,
    LeaveRequestResponse,
    LeaveBalanceCreate,
    LeaveBalanceUpdate,
    LeaveBalanceResponse,
    PerformanceReviewCreate,
    PerformanceReviewUpdate,
    PerformanceReviewResponse,
    AttendanceRecordCreate,
    AttendanceRecordUpdate,
    AttendanceRecordResponse,
    EmployeeSummary,
    LeaveSummary,
)

router = APIRouter()


# ===== Employee Endpoints =====

@router.post("/employees", response_model=EmployeeResponse)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new employee"""
    # Check if employee code already exists
    result = await db.execute(
        select(Employee).where(Employee.employee_code == employee_data.employee_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee code already exists")

    employee = Employee(**employee_data.model_dump(), created_by="system")
    db.add(employee)
    await db.flush()
    await db.refresh(employee)
    return employee


@router.get("/employees", response_model=List[EmployeeResponse])
async def get_employees(
    skip: int = 0,
    limit: int = 100,
    status: Optional[EmploymentStatus] = None,
    department_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all employees with filters"""
    query = select(Employee)

    if status:
        query = query.where(Employee.employment_status == status)
    if department_id:
        query = query.where(Employee.department_id == department_id)
    if is_active is not None:
        query = query.where(Employee.is_active == is_active)

    query = query.offset(skip).limit(limit).order_by(Employee.employee_code)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get employee by ID"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    employee_data: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update employee"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    update_data = employee_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)

    await db.flush()
    await db.refresh(employee)
    return employee


@router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: UUID, db: AsyncSession = Depends(get_db)):
    """Soft delete employee"""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    employee = result.scalar_one_or_none()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    employee.is_active = False
    employee.employment_status = EmploymentStatus.TERMINATED
    await db.flush()
    return {"message": "Employee deactivated successfully"}


@router.get("/employees/summary", response_model=EmployeeSummary)
async def get_employee_summary(db: AsyncSession = Depends(get_db)):
    """Get employee summary statistics"""
    # Total employees
    total_result = await db.execute(select(func.count(Employee.id)))
    total = total_result.scalar()

    # Active employees
    active_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.employment_status == EmploymentStatus.ACTIVE
        )
    )
    active = active_result.scalar()

    # On leave
    leave_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.employment_status == EmploymentStatus.ON_LEAVE
        )
    )
    on_leave = leave_result.scalar()

    # Terminated
    term_result = await db.execute(
        select(func.count(Employee.id)).where(
            Employee.employment_status == EmploymentStatus.TERMINATED
        )
    )
    terminated = term_result.scalar()

    return EmployeeSummary(
        total_employees=total,
        active_employees=active,
        on_leave=on_leave,
        terminated=terminated,
        by_department={},
        by_employment_type={}
    )


@router.post("/employees/transfer-from-recruitment")
async def transfer_from_recruitment(
    employees_data: dict,
    db: AsyncSession = Depends(get_db),
):
    """Transfer hired candidates from recruitment to employee management"""
    try:
        employees = employees_data.get("employees", [])
        created_employees = []

        for emp_data in employees:
            # Generate employee code (you can customize this logic)
            # Get the last employee code number
            last_emp_result = await db.execute(
                select(Employee).order_by(Employee.employee_code.desc()).limit(1)
            )
            last_emp = last_emp_result.scalar_one_or_none()

            if last_emp and last_emp.employee_code:
                # Extract number from code like "EMP001" -> 1
                try:
                    last_num = int(last_emp.employee_code.replace("EMP", ""))
                    new_code = f"EMP{str(last_num + 1).zfill(3)}"
                except:
                    new_code = "EMP001"
            else:
                new_code = "EMP001"

            # Get or create department
            department_id = None
            if emp_data.get("department"):
                dept_result = await db.execute(
                    select(Department).where(Department.name == emp_data["department"])
                )
                department = dept_result.scalar_one_or_none()
                if department:
                    department_id = department.id

            # Create employee record
            new_employee = Employee(
                employee_code=new_code,
                first_name=emp_data["name"].split()[0] if emp_data.get("name") else "Unknown",
                last_name=" ".join(emp_data["name"].split()[1:]) if emp_data.get("name") and len(emp_data["name"].split()) > 1 else "",
                work_email=emp_data.get("email"),
                personal_email=emp_data.get("email"),
                work_phone=emp_data.get("phone"),
                personal_phone=emp_data.get("phone"),
                department_id=department_id,
                job_title=emp_data.get("position"),
                employment_type=EmploymentType.FULL_TIME,
                employment_status=EmploymentStatus.ACTIVE,
                hire_date=datetime.fromisoformat(emp_data["start_date"]).date() if emp_data.get("start_date") else date.today(),
                base_salary=float(emp_data["salary"]) if emp_data.get("salary") else None,
                is_active=True,
                created_by="recruitment_system"
            )

            db.add(new_employee)
            await db.flush()
            await db.refresh(new_employee)
            created_employees.append({
                "employee_code": new_employee.employee_code,
                "name": f"{new_employee.first_name} {new_employee.last_name}",
                "email": new_employee.work_email
            })

        await db.commit()

        return {
            "message": f"Successfully transferred {len(created_employees)} employee(s)",
            "employees": created_employees
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer failed: {str(e)}")


# ===== Department Endpoints =====

@router.post("/departments", response_model=DepartmentResponse)
async def create_department(
    dept_data: DepartmentCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new department"""
    result = await db.execute(
        select(Department).where(Department.department_code == dept_data.department_code)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Department code already exists")

    department = Department(**dept_data.model_dump())
    db.add(department)
    await db.flush()
    await db.refresh(department)
    return department


@router.get("/departments", response_model=List[DepartmentResponse])
async def get_departments(
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get all departments"""
    query = select(Department)
    if is_active is not None:
        query = query.where(Department.is_active == is_active)

    query = query.order_by(Department.name)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/departments/{dept_id}", response_model=DepartmentResponse)
async def get_department(dept_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get department by ID"""
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept


@router.put("/departments/{dept_id}", response_model=DepartmentResponse)
async def update_department(
    dept_id: UUID,
    dept_data: DepartmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update department"""
    result = await db.execute(select(Department).where(Department.id == dept_id))
    dept = result.scalar_one_or_none()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    update_data = dept_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dept, field, value)

    await db.flush()
    await db.refresh(dept)
    return dept


# ===== Leave Request Endpoints =====

@router.post("/leave-requests", response_model=LeaveRequestResponse)
async def create_leave_request(
    leave_data: LeaveRequestCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create leave request"""
    # Verify employee exists
    result = await db.execute(select(Employee).where(Employee.id == leave_data.employee_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Employee not found")

    leave_request = LeaveRequest(**leave_data.model_dump())
    db.add(leave_request)
    await db.flush()
    await db.refresh(leave_request)
    return leave_request


@router.get("/leave-requests", response_model=List[LeaveRequestResponse])
async def get_leave_requests(
    employee_id: Optional[UUID] = None,
    status: Optional[LeaveStatus] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get leave requests"""
    query = select(LeaveRequest)

    if employee_id:
        query = query.where(LeaveRequest.employee_id == employee_id)
    if status:
        query = query.where(LeaveRequest.status == status)
    if start_date:
        query = query.where(LeaveRequest.start_date >= start_date)
    if end_date:
        query = query.where(LeaveRequest.end_date <= end_date)

    query = query.order_by(desc(LeaveRequest.created_at))
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/leave-requests/{request_id}/approve", response_model=LeaveRequestResponse)
async def approve_leave_request(
    request_id: UUID,
    approver_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Approve leave request"""
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
    leave_request = result.scalar_one_or_none()
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave_request.status = LeaveStatus.APPROVED
    leave_request.approved_by_id = approver_id
    leave_request.approved_at = datetime.utcnow()

    await db.flush()
    await db.refresh(leave_request)
    return leave_request


@router.post("/leave-requests/{request_id}/reject", response_model=LeaveRequestResponse)
async def reject_leave_request(
    request_id: UUID,
    reason: str,
    db: AsyncSession = Depends(get_db),
):
    """Reject leave request"""
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
    leave_request = result.scalar_one_or_none()
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    leave_request.status = LeaveStatus.REJECTED
    leave_request.rejection_reason = reason

    await db.flush()
    await db.refresh(leave_request)
    return leave_request


@router.put("/leave-requests/{request_id}", response_model=LeaveRequestResponse)
async def update_leave_request(
    request_id: UUID,
    leave_data: LeaveRequestUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update leave request (only for pending requests)"""
    result = await db.execute(select(LeaveRequest).where(LeaveRequest.id == request_id))
    leave_request = result.scalar_one_or_none()
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Only allow updates to pending requests
    if leave_request.status != LeaveStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail="Can only update pending leave requests"
        )

    update_data = leave_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(leave_request, field, value)

    await db.flush()
    await db.refresh(leave_request)
    return leave_request


# ===== Leave Balance Endpoints =====

@router.post("/leave-balances", response_model=LeaveBalanceResponse)
async def create_leave_balance(
    balance_data: LeaveBalanceCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create or update leave balance"""
    # Check if already exists
    result = await db.execute(
        select(LeaveBalance).where(
            and_(
                LeaveBalance.employee_id == balance_data.employee_id,
                LeaveBalance.leave_type == balance_data.leave_type,
                LeaveBalance.year == balance_data.year
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Update existing
        existing.total_allocated = balance_data.total_allocated
        existing.carried_forward = balance_data.carried_forward
        existing.total_available = (
            balance_data.total_allocated +
            balance_data.carried_forward -
            existing.total_used -
            existing.total_pending
        )
        await db.flush()
        await db.refresh(existing)
        return existing

    # Create new
    balance = LeaveBalance(**balance_data.model_dump())
    balance.total_available = balance.total_allocated + balance.carried_forward
    db.add(balance)
    await db.flush()
    await db.refresh(balance)
    return balance


@router.get("/leave-balances", response_model=List[LeaveBalanceResponse])
async def get_leave_balances(
    employee_id: Optional[UUID] = None,
    year: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get leave balances"""
    query = select(LeaveBalance)

    if employee_id:
        query = query.where(LeaveBalance.employee_id == employee_id)
    if year:
        query = query.where(LeaveBalance.year == year)

    result = await db.execute(query)
    return result.scalars().all()


# ===== Attendance Endpoints =====

@router.post("/attendance", response_model=AttendanceRecordResponse)
async def create_attendance_record(
    attendance_data: AttendanceRecordCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create attendance record"""
    # Check if record already exists for this date
    result = await db.execute(
        select(AttendanceRecord).where(
            and_(
                AttendanceRecord.employee_id == attendance_data.employee_id,
                AttendanceRecord.attendance_date == attendance_data.attendance_date
            )
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Attendance record already exists for this date"
        )

    attendance = AttendanceRecord(**attendance_data.model_dump())
    db.add(attendance)
    await db.flush()
    await db.refresh(attendance)
    return attendance


@router.get("/attendance", response_model=List[AttendanceRecordResponse])
async def get_attendance_records(
    employee_id: Optional[UUID] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get attendance records"""
    query = select(AttendanceRecord)

    if employee_id:
        query = query.where(AttendanceRecord.employee_id == employee_id)
    if start_date:
        query = query.where(AttendanceRecord.attendance_date >= start_date)
    if end_date:
        query = query.where(AttendanceRecord.attendance_date <= end_date)

    query = query.order_by(desc(AttendanceRecord.attendance_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/attendance/{attendance_id}", response_model=AttendanceRecordResponse)
async def update_attendance_record(
    attendance_id: UUID,
    attendance_data: AttendanceRecordUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update attendance record"""
    result = await db.execute(
        select(AttendanceRecord).where(AttendanceRecord.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    update_data = attendance_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(attendance, field, value)

    await db.flush()
    await db.refresh(attendance)
    return attendance


# ===== Performance Review Endpoints =====

@router.post("/performance-reviews", response_model=PerformanceReviewResponse)
async def create_performance_review(
    review_data: PerformanceReviewCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create performance review"""
    review = PerformanceReview(**review_data.model_dump())
    db.add(review)
    await db.flush()
    await db.refresh(review)
    return review


@router.get("/performance-reviews", response_model=List[PerformanceReviewResponse])
async def get_performance_reviews(
    employee_id: Optional[UUID] = None,
    reviewer_id: Optional[UUID] = None,
    is_finalized: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    """Get performance reviews"""
    query = select(PerformanceReview)

    if employee_id:
        query = query.where(PerformanceReview.employee_id == employee_id)
    if reviewer_id:
        query = query.where(PerformanceReview.reviewer_id == reviewer_id)
    if is_finalized is not None:
        query = query.where(PerformanceReview.is_finalized == is_finalized)

    query = query.order_by(desc(PerformanceReview.review_date))
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/performance-reviews/{review_id}", response_model=PerformanceReviewResponse)
async def update_performance_review(
    review_id: UUID,
    review_data: PerformanceReviewUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update performance review"""
    result = await db.execute(
        select(PerformanceReview).where(PerformanceReview.id == review_id)
    )
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Performance review not found")

    update_data = review_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)

    if update_data.get('is_finalized') and not review.finalized_at:
        review.finalized_at = datetime.utcnow()

    await db.flush()
    await db.refresh(review)
    return review
