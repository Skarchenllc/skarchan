from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from uuid import UUID


# Budget Schemas
class BudgetBase(BaseModel):
    budget_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    budget_type: str  # operational, capital, project, departmental, master
    period_type: str  # monthly, quarterly, annually, custom
    start_date: date
    end_date: date
    department: Optional[str] = Field(None, max_length=100)
    project_id: Optional[UUID] = None
    notes: Optional[str] = None

    @validator('end_date')
    def end_date_after_start_date(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    budget_type: Optional[str] = None
    period_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    department: Optional[str] = Field(None, max_length=100)
    project_id: Optional[UUID] = None
    notes: Optional[str] = None


class BudgetResponse(BudgetBase):
    id: UUID
    status: str
    total_budget_amount: float
    total_actual_amount: float
    total_variance: float
    variance_percentage: float
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Budget Line Schemas
class BudgetLineBase(BaseModel):
    budget_id: UUID
    account_id: UUID
    budgeted_amount: float = Field(..., description="Budgeted amount for this account")
    period_breakdown: Optional[Dict[str, float]] = None
    notes: Optional[str] = None


class BudgetLineCreate(BudgetLineBase):
    pass


class BudgetLineUpdate(BaseModel):
    budgeted_amount: Optional[float] = None
    period_breakdown: Optional[Dict[str, float]] = None
    notes: Optional[str] = None


class BudgetLineResponse(BudgetLineBase):
    id: UUID
    actual_amount: float
    committed_amount: float
    available_amount: float
    variance: float
    variance_percentage: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Budget Line with Account Details
class BudgetLineWithAccount(BudgetLineResponse):
    account_code: str
    account_name: str
    account_type: str


# Budget Revision Schemas
class BudgetRevisionBase(BaseModel):
    budget_id: UUID
    revision_number: str = Field(..., min_length=1, max_length=50)
    revision_date: date
    reason: Optional[str] = None
    changes: Optional[Dict[str, Any]] = None
    previous_total: Optional[float] = None
    new_total: Optional[float] = None
    adjustment_amount: Optional[float] = None


class BudgetRevisionCreate(BudgetRevisionBase):
    pass


class BudgetRevisionResponse(BudgetRevisionBase):
    id: UUID
    approved_by: Optional[str]
    approved_at: Optional[datetime]
    created_by: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# Budget Alert Schemas
class BudgetAlertBase(BaseModel):
    budget_id: UUID
    budget_line_id: Optional[UUID] = None
    alert_type: str
    severity: str  # info, warning, critical
    threshold_percentage: Optional[float] = None
    threshold_amount: Optional[float] = None
    current_percentage: Optional[float] = None
    current_amount: Optional[float] = None
    message: Optional[str] = None


class BudgetAlertCreate(BudgetAlertBase):
    pass


class BudgetAlertResponse(BudgetAlertBase):
    id: UUID
    is_resolved: bool
    resolved_by: Optional[str]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    triggered_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


# Budget Scenario Schemas
class BudgetScenarioBase(BaseModel):
    scenario_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    base_budget_id: Optional[UUID] = None
    scenario_type: Optional[str] = None  # best_case, worst_case, conservative, aggressive
    adjustment_method: Optional[str] = None  # percentage, fixed_amount, custom
    global_adjustment_percentage: Optional[float] = None
    global_adjustment_amount: Optional[float] = None
    scenario_data: Optional[Dict[str, Any]] = None


class BudgetScenarioCreate(BudgetScenarioBase):
    pass


class BudgetScenarioUpdate(BaseModel):
    scenario_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    scenario_type: Optional[str] = None
    adjustment_method: Optional[str] = None
    global_adjustment_percentage: Optional[float] = None
    global_adjustment_amount: Optional[float] = None
    scenario_data: Optional[Dict[str, Any]] = None


class BudgetScenarioResponse(BudgetScenarioBase):
    id: UUID
    total_scenario_amount: float
    variance_from_base: float
    variance_percentage: float
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Budget Template Schemas
class BudgetTemplateBase(BaseModel):
    template_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    template_data: Optional[Dict[str, Any]] = None


class BudgetTemplateCreate(BudgetTemplateBase):
    pass


class BudgetTemplateUpdate(BaseModel):
    template_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    template_data: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class BudgetTemplateResponse(BudgetTemplateBase):
    id: UUID
    is_active: bool
    times_used: float
    created_by: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Budget Summary and Analytics
class BudgetSummary(BaseModel):
    budget_id: UUID
    budget_code: str
    budget_name: str
    total_budgeted: float
    total_actual: float
    total_committed: float
    total_available: float
    total_variance: float
    variance_percentage: float
    utilization_percentage: float
    status: str


class BudgetPerformance(BaseModel):
    budget_id: UUID
    period: str
    budgeted: float
    actual: float
    variance: float
    variance_percentage: float


class BudgetComparison(BaseModel):
    account_code: str
    account_name: str
    budget_1_amount: float
    budget_2_amount: float
    difference: float
    difference_percentage: float


# Bulk Budget Line Create
class BulkBudgetLineCreate(BaseModel):
    budget_id: UUID
    lines: List[Dict[str, Any]]  # List of account_id and budgeted_amount pairs


# Budget Approval
class BudgetApproval(BaseModel):
    approved_by: str
    notes: Optional[str] = None
