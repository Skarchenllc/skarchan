from fastapi import APIRouter
from . import employees, recruitment, recruitment_phases, employee_credentials, compensation, payroll, uploads

router = APIRouter()

# Include endpoint routers
router.include_router(employees.router, tags=["HR Management"])
router.include_router(employee_credentials.router, tags=["Employee Credentials"])
router.include_router(recruitment.router, prefix="/recruitment", tags=["Recruitment"])
router.include_router(recruitment_phases.router, prefix="/recruitment", tags=["Recruitment Phases"])
router.include_router(compensation.router, prefix="/compensation", tags=["Compensation & Benefits"])
router.include_router(payroll.router, tags=["Payroll"])
router.include_router(uploads.router, tags=["Uploads"])

@router.get("/")
async def root():
    return {"message": "HR API is working"}
