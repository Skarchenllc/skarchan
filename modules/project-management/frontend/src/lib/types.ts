export interface PMProject {
  id: string;
  project_code: string;
  project_name: string;
  description?: string;
  project_manager?: string;
  client_name?: string;
  priority: string;
  status: string;
  start_date: string;
  expected_end_date?: string;
  actual_end_date?: string;
  budget_allocated?: number;
  budget_spent?: number;
  progress_percentage?: number;
  project_type?: string;
  objectives?: string;
  deliverables?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PMTask {
  id: string;
  task_code: string;
  task_name: string;
  description?: string;
  project_id?: string;
  assigned_to?: string;
  priority: string;
  status: string;
  start_date: string;
  due_date?: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  progress_percentage?: number;
  dependencies?: string;
  task_type?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PMMilestone {
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

export interface PMResource {
  id: string;
  resource_code: string;
  resource_name: string;
  description?: string;
  resource_type: string;
  project_id?: string;
  allocation_percentage?: number;
  cost_per_hour?: number;
  availability_status?: string;
  start_date: string;
  end_date?: string;
  role?: string;
  skills?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimeTracking {
  id: string;
  task_id?: string;
  project_id?: string;
  resource_id?: string;
  work_date: string;
  hours_worked: number;
  work_description?: string;
  billable: boolean;
  billing_rate?: number;
  status?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PMBudget {
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
  currency?: string;
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
