export interface RDProject {
  id: string;
  project_code: string;
  project_name: string;
  description?: string;
  research_area: string;
  project_type: string;
  priority: string;
  status: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  principal_investigator?: string;
  budget_allocated?: number;
  budget_spent?: number;
  objectives?: string;
  expected_outcomes?: string;
  progress_percentage?: number;
  confidentiality_level?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Experiment {
  id: string;
  experiment_code: string;
  experiment_name: string;
  description?: string;
  experiment_type: string;
  project_id?: string;
  hypothesis?: string;
  methodology?: string;
  start_date: string;
  end_date?: string;
  status: string;
  lead_researcher?: string;
  results_summary?: string;
  conclusions?: string;
  success_rating?: number;
  reproducibility_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Prototype {
  id: string;
  prototype_code: string;
  prototype_name: string;
  description?: string;
  project_id?: string;
  prototype_version: string;
  development_stage: string;
  status: string;
  start_date: string;
  completion_date?: string;
  testing_status?: string;
  test_results?: string;
  manufacturing_feasibility?: string;
  estimated_cost?: number;
  specifications?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  abstract?: string;
  publication_type: string;
  journal_conference?: string;
  publication_date?: string;
  doi?: string;
  url?: string;
  project_id?: string;
  keywords?: string;
  status: string;
  citation_count?: number;
  impact_factor?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Patent {
  id: string;
  patent_number?: string;
  title: string;
  description?: string;
  inventors: string;
  patent_type: string;
  project_id?: string;
  filing_date?: string;
  publication_date?: string;
  grant_date?: string;
  expiry_date?: string;
  status: string;
  jurisdiction?: string;
  application_number?: string;
  patent_office_url?: string;
  filing_cost?: number;
  maintenance_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LabEquipment {
  id: string;
  equipment_code: string;
  equipment_name: string;
  description?: string;
  equipment_type: string;
  manufacturer?: string;
  model_number?: string;
  serial_number?: string;
  location: string;
  purchase_date?: string;
  purchase_cost?: number;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  calibration_due_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchTeamMember {
  id: string;
  employee_id?: string;
  full_name: string;
  role: string;
  expertise_area?: string;
  project_id?: string;
  email?: string;
  phone?: string;
  start_date: string;
  end_date?: string;
  allocation_percentage?: number;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RDMilestone {
  id: string;
  milestone_name: string;
  description?: string;
  project_id?: string;
  due_date: string;
  completion_date?: string;
  status: string;
  deliverables?: string;
  responsible_person?: string;
  progress_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RDBudget {
  id: string;
  budget_name: string;
  project_id?: string;
  fiscal_year: string;
  allocated_amount: number;
  spent_amount?: number;
  category?: string;
  status: string;
  approval_date?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RDCollaboration {
  id: string;
  collaboration_name: string;
  description?: string;
  collaboration_type: string;
  partner_organization: string;
  project_id?: string;
  start_date: string;
  end_date?: string;
  status: string;
  contact_person?: string;
  contact_email?: string;
  agreement_details?: string;
  funding_contribution?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StatsOverview {
  total_count?: number;
  active_count?: number;
  completed_count?: number;
  pending_count?: number;
  in_progress_count?: number;
  [key: string]: any;
}
