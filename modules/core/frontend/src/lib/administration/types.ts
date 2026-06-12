// TypeScript interfaces matching backend models exactly

export interface ExecutiveBoard {
  id: string;
  member_name: string;
  position: string;
  department?: string;
  email?: string;
  phone?: string;
  bio?: string;
  photo_url?: string;
  start_date?: string;
  reports_to?: string;
  status: 'active' | 'inactive' | 'on_leave';
  created_at: string;
  updated_at: string;
}

export interface LegalCase {
  id: string;
  case_number: string;
  title: string;
  case_type: 'litigation' | 'contract_dispute' | 'regulatory' | 'intellectual_property' | 'employment' | 'other';
  description?: string;
  plaintiff?: string;
  defendant?: string;
  court_jurisdiction?: string;
  filing_date?: string;
  status: 'open' | 'in_progress' | 'settled' | 'closed' | 'appealed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_attorney?: string;
  estimated_value?: number;
  actual_cost?: number;
  outcome?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompliancePolicy {
  id: string;
  policy_code: string;
  policy_name: string;
  category: 'data_privacy' | 'financial' | 'operational' | 'ethical' | 'safety' | 'environmental' | 'other';
  description?: string;
  version: string;
  effective_date?: string;
  review_date?: string;
  owner_department?: string;
  status: 'draft' | 'active' | 'under_review' | 'archived';
  document_url?: string;
  scope?: string;
  compliance_requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceAudit {
  id: string;
  audit_number: string;
  title: string;
  audit_type: 'internal' | 'external' | 'regulatory' | 'follow_up';
  policy_id?: string;
  policy?: CompliancePolicy;
  auditor_name?: string;
  audit_date?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'deferred';
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  findings?: string;
  recommendations?: string;
  action_items?: string;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StrategicInitiative {
  id: string;
  initiative_name: string;
  category: 'growth' | 'efficiency' | 'innovation' | 'transformation' | 'market_expansion' | 'other';
  description?: string;
  objectives?: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  start_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  budget?: number;
  actual_spend?: number;
  progress_percentage?: number;
  owner?: string;
  stakeholders?: string;
  kpis?: string;
  milestones?: string;
  risks?: string;
  dependencies?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// API Response wrapper types
export interface ApiResponse<T> {
  executive_board?: T;
  legal_cases?: T;
  compliance_policies?: T;
  compliance_audits?: T;
  strategic_initiatives?: T;
}

// Statistics type for dashboard
export interface DashboardStats {
  executive_board_count: number;
  legal_cases_count: number;
  compliance_policies_count: number;
  compliance_audits_count: number;
  strategic_initiatives_count: number;
}
