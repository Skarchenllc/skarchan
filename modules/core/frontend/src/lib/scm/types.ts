export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_type: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  website?: string;
  tax_id?: string;
  payment_terms?: string;
  credit_limit?: number;
  rating?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrder {
  id: string;
  po_number: string;
  supplier_id?: string;
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: string;
  priority?: string;
  total_amount?: number;
  tax_amount?: number;
  shipping_cost?: number;
  discount_amount?: number;
  grand_total?: number;
  payment_status?: string;
  payment_method?: string;
  shipping_address?: string;
  billing_address?: string;
  requisition_id?: string;
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseRequisition {
  id: string;
  requisition_number: string;
  requisition_date: string;
  requested_by?: string;
  department?: string;
  requisition_type: string;
  priority?: string;
  required_date?: string;
  status: string;
  total_estimated_cost?: number;
  justification?: string;
  approved_by?: string;
  approval_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RFQ {
  id: string;
  rfq_number: string;
  rfq_date: string;
  rfq_type: string;
  subject?: string;
  description?: string;
  supplier_id?: string;
  submission_deadline?: string;
  evaluation_criteria?: string;
  status: string;
  selected_quotation_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierContract {
  id: string;
  contract_number: string;
  supplier_id?: string;
  contract_type: string;
  contract_title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  contract_value?: number;
  payment_terms?: string;
  delivery_terms?: string;
  penalty_clause?: string;
  renewal_terms?: string;
  status: string;
  signed_date?: string;
  signed_by_supplier?: string;
  signed_by_company?: string;
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
