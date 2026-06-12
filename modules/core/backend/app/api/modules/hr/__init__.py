"""
Human Resources Module APIs - Consolidated in Core Backend
"""
from fastapi import APIRouter
from . import employees
from . import departments
from . import positions
from . import leave_requests
from . import leave_balances
from . import performance_reviews
from . import attendance
from . import employee_credentials
from . import pay_grades
from . import salary_bands
from . import benefits_plans
from . import employee_benefits
from . import bonuses
from . import commissions
from . import salary_adjustments
from . import hr_payroll_runs
from . import hr_payslips
from . import job_requisitions
from . import applicants
from . import advertisements
from . import interviews
from . import assessments
from . import background_checks
from . import job_offers
from . import employees
from . import attendance
from . import time_off
from . import performance_reviews
from . import recruitment
from . import training

router = APIRouter()

router.include_router(employees.router, prefix="/employees", tags=["Human Resources - Employees"])
router.include_router(departments.router, prefix="/departments", tags=["Human Resources - Departments"])
router.include_router(positions.router, prefix="/positions", tags=["Human Resources - Job Positions"])
router.include_router(leave_requests.router, prefix="/leave-requests", tags=["Human Resources - Leave Requests"])
router.include_router(leave_balances.router, prefix="/leave-balances", tags=["Human Resources - Leave Balances"])
router.include_router(performance_reviews.router, prefix="/performance-reviews", tags=["Human Resources - Performance Reviews"])
router.include_router(attendance.router, prefix="/attendance", tags=["Human Resources - Attendance Records"])
router.include_router(employee_credentials.router, prefix="/employee-credentials", tags=["Human Resources - Employee Portal Access"])
router.include_router(pay_grades.router, prefix="/pay-grades", tags=["Human Resources - Pay Grades"])
router.include_router(salary_bands.router, prefix="/salary-bands", tags=["Human Resources - Salary Bands"])
router.include_router(benefits_plans.router, prefix="/benefits-plans", tags=["Human Resources - Benefits Plans"])
router.include_router(employee_benefits.router, prefix="/employee-benefits", tags=["Human Resources - Employee Benefits"])
router.include_router(bonuses.router, prefix="/bonuses", tags=["Human Resources - Employee Bonuses"])
router.include_router(commissions.router, prefix="/commissions", tags=["Human Resources - Sales Commissions"])
router.include_router(salary_adjustments.router, prefix="/salary-adjustments", tags=["Human Resources - Salary Adjustments"])
router.include_router(hr_payroll_runs.router, prefix="/hr-payroll-runs", tags=["Human Resources - Payroll Runs (HR)"])
router.include_router(hr_payslips.router, prefix="/hr-payslips", tags=["Human Resources - Payslips (HR)"])
router.include_router(job_requisitions.router, prefix="/job-requisitions", tags=["Human Resources - Job Requisitions"])
router.include_router(applicants.router, prefix="/applicants", tags=["Human Resources - Job Applicants"])
router.include_router(advertisements.router, prefix="/advertisements", tags=["Human Resources - Job Advertisements"])
router.include_router(interviews.router, prefix="/interviews", tags=["Human Resources - Interviews"])
router.include_router(assessments.router, prefix="/assessments", tags=["Human Resources - Candidate Assessments"])
router.include_router(background_checks.router, prefix="/background-checks", tags=["Human Resources - Background Checks"])
router.include_router(job_offers.router, prefix="/job-offers", tags=["Human Resources - Job Offers"])
router.include_router(employees.router, prefix="/employees", tags=["Human Resources - Employees"])
router.include_router(attendance.router, prefix="/attendance", tags=["Human Resources - Attendance"])
router.include_router(time_off.router, prefix="/time-off", tags=["Human Resources - Time Off Requests"])
router.include_router(performance_reviews.router, prefix="/performance-reviews", tags=["Human Resources - Performance Reviews"])
router.include_router(recruitment.router, prefix="/recruitment", tags=["Human Resources - Recruitment"])
router.include_router(training.router, prefix="/training", tags=["Human Resources - Training & Development"])
