export interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  priority: string;
  status: string;
  category?: string;
  assigned_to?: string;
  created_date: string;
  last_updated?: string;
  resolved_date?: string;
  resolution_notes?: string;
  response_time_hours?: number;
  resolution_time_hours?: number;
  satisfaction_rating?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeBase {
  id: string;
  article_title: string;
  article_content?: string;
  article_summary?: string;
  category: string;
  article_type: string;
  keywords?: string;
  author?: string;
  status: string;
  publish_date?: string;
  last_reviewed_date?: string;
  view_count?: number;
  helpful_count?: number;
  not_helpful_count?: number;
  related_articles?: string;
  attachment_url?: string;
  version?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  request_title: string;
  description?: string;
  request_type: string;
  customer_name: string;
  customer_email?: string;
  priority: string;
  status: string;
  assigned_to?: string;
  requested_date: string;
  due_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  cost_estimate?: number;
  actual_cost?: number;
  approval_status?: string;
  approved_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFeedback {
  id: string;
  feedback_date: string;
  customer_name: string;
  customer_email?: string;
  feedback_type: string;
  subject?: string;
  feedback_text?: string;
  rating?: number;
  product_service?: string;
  ticket_id?: string;
  status: string;
  assigned_to?: string;
  response_date?: string;
  response_text?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
  sentiment?: string;
  category?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SLAAgreement {
  id: string;
  agreement_name: string;
  description?: string;
  customer_name?: string;
  agreement_type: string;
  priority_level: string;
  status: string;
  start_date: string;
  end_date?: string;
  response_time_hours: number;
  resolution_time_hours: number;
  uptime_percentage?: number;
  support_hours?: string;
  escalation_process?: string;
  penalties?: string;
  contact_person?: string;
  contact_email?: string;
  review_date?: string;
  compliance_percentage?: number;
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
