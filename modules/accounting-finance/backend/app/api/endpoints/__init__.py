from fastapi import APIRouter
from . import accounts, transactions, reports, fixed_assets, tax, seed, uploads, bank_reconciliation, ap_ar, currency, budgets, periods, payroll

router = APIRouter()

# Include endpoint routers
router.include_router(accounts.router, prefix="/accounts", tags=["Accounts"])
router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
router.include_router(reports.router, tags=["Reports & AI"])
router.include_router(fixed_assets.router, prefix="/fixed-assets", tags=["Fixed Assets"])
router.include_router(tax.router, prefix="/tax", tags=["Tax Management"])
router.include_router(bank_reconciliation.router, prefix="/bank-reconciliation", tags=["Bank Reconciliation"])
router.include_router(ap_ar.router, prefix="/ap-ar", tags=["Accounts Payable & Receivable"])
router.include_router(currency.router, prefix="/currency", tags=["Multi-Currency"])
router.include_router(budgets.router, prefix="/budgets", tags=["Budget Management"])
router.include_router(periods.router, prefix="/periods", tags=["Period Management"])
router.include_router(payroll.router, prefix="/payroll", tags=["Payroll Management"])
router.include_router(seed.router, prefix="/seed", tags=["Seed Data"])
router.include_router(uploads.router, prefix="/uploads", tags=["File Uploads"])

@router.get("/")
async def root():
    return {"message": "API is working"}
