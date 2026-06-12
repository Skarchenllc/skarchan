// Shared TypeScript interfaces for Compensation Module

export interface PayGrade {
  id: string;
  grade_code: string;
  grade_name: string;
  grade_level: number;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  currency: string;
  description: string;
  is_active?: boolean;
}

export interface SalaryBand {
  id: string;
  job_title: string;
  department: string;
  min_salary: number;
  mid_salary: number;
  max_salary: number;
  currency: string;
  market_data_source: string;
  last_reviewed_date: string;
  is_active?: boolean;
}

export interface BenefitsPlan {
  id: string;
  plan_code: string;
  plan_name: string;
  plan_type: string;
  provider_name: string;
  coverage_level: string;
  employee_cost_monthly: number;
  employer_cost_monthly: number;
  total_cost_monthly: number;
  deductible: number;
  out_of_pocket_max: number;
  coverage_details?: any;
  eligibility_criteria?: string;
  is_active?: boolean;
  effective_date?: string;
  termination_date?: string;
}

export interface Bonus {
  id: string;
  employee_id: string;
  bonus_type: string;
  bonus_name: string;
  amount: number;
  currency?: string;
  performance_period_start?: string;
  performance_period_end?: string;
  payout_date: string;
  status: string;
  approved_by?: string;
  approved_at?: string;
  paid_date?: string;
  notes?: string;
}

export interface Employee {
  id: string;
  employee_code: string;
  first_name: string;
  last_name: string;
}

export interface SalaryAdjustment {
  id: string;
  employee_id: string;
  adjustment_type: string;
  previous_salary: number;
  new_salary: number;
  adjustment_amount: number;
  adjustment_percentage: number;
  effective_date: string;
  reason: string;
  approved_by: string;
  approved_at?: string;
}

export interface CompensationOverview {
  total_payroll: number;
  avg_salary: number;
  employee_count: number;
  benefits_monthly: number;
  benefits_annual: number;
  bonuses_ytd: number;
  total_compensation: number;
}

// Bonus status types
export type BonusStatus = 'pending' | 'approved' | 'paid' | 'cancelled';

// Benefits plan types
export type BenefitPlanType = 'health' | 'dental' | 'vision' | 'life' | '401k' | 'disability';

// Salary adjustment types
export type AdjustmentType = 'annual_increase' | 'promotion' | 'market_adjustment' | 'merit_increase' | 'demotion' | 'correction';
