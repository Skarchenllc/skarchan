export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  description?: string;
  category: string;
  unit_of_measure: string;
  standard_cost?: number;
  selling_price?: number;
  reorder_point?: number;
  lead_time_days?: number;
  specifications?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkOrder {
  id: string;
  work_order_number: string;
  product_id: string;
  product_name?: string;
  bom_id?: string;
  quantity_planned: number;
  quantity_produced: number;
  quantity_rejected: number;
  unit_of_measure: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  production_line?: string;
  scheduled_start_date?: string;
  scheduled_end_date?: string;
  actual_start_date?: string;
  actual_end_date?: string;
  assigned_to?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  product_name?: string;
  location: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  minimum_stock_level?: number;
  maximum_stock_level?: number;
  reorder_point?: number;
  last_restock_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionLine {
  id: string;
  line_code: string;
  line_name: string;
  location?: string;
  capacity_per_hour?: number;
  status: 'operational' | 'idle' | 'maintenance' | 'offline';
  current_work_order_id?: string;
  work_order_number?: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BillOfMaterial {
  id: string;
  bom_code: string;
  product_id: string;
  product_name?: string;
  version: string;
  description?: string;
  is_active: boolean;
  effective_date?: string;
  obsolete_date?: string;
  notes?: string;
  materials?: any[];
  created_at: string;
  updated_at: string;
}

export interface BillOfMaterialItem {
  id: number;
  bom_id: number;
  material_id: number;
  quantity: number;
  unit_of_measure: string;
  is_optional: boolean;
  notes?: string;
  material?: Product;
}

export interface StatsOverview {
  total_count?: number;
  active_count?: number;
  low_stock_count?: number;
  pending_count?: number;
  in_progress_count?: number;
  completed_count?: number;
  [key: string]: any;
}
