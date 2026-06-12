export interface StockItem {
  id: string;
  item_code: string;
  item_name: string;
  description?: string;
  category: string;
  unit_of_measure: string;
  reorder_level?: number;
  reorder_quantity?: number;
  current_stock?: number;
  warehouse_id?: string;
  unit_price?: number;
  supplier_id?: string;
  barcode?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  warehouse_code: string;
  warehouse_name: string;
  description?: string;
  warehouse_type: string;
  location: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  capacity?: number;
  manager_name?: string;
  contact_phone?: string;
  contact_email?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  movement_type: string;
  stock_item_id?: string;
  warehouse_id?: string;
  quantity: number;
  movement_date: string;
  reference_number?: string;
  source?: string;
  destination?: string;
  unit_price?: number;
  total_value?: number;
  performed_by?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: string;
  adjustment_type: string;
  stock_item_id?: string;
  warehouse_id?: string;
  quantity_before?: number;
  quantity_adjusted: number;
  quantity_after?: number;
  adjustment_date: string;
  reason?: string;
  reference_number?: string;
  approved_by?: string;
  status: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  stock_item_id?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  quantity: number;
  transfer_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  status: string;
  initiated_by?: string;
  approved_by?: string;
  received_by?: string;
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
