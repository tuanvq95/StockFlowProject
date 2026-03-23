export interface DashboardSummary {
  total_products: number;
  total_stock_units: number;
  total_stock_value: number;
  low_stock_count: number;
  imports_this_month: number;
  exports_this_month: number;
}

export interface DailyPoint {
  date: string;
  import_qty: number;
  export_qty: number;
  import_amount: number;
  export_amount: number;
}

export interface TopProduct {
  name: string;
  stock: number;
  value: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  daily_activity: DailyPoint[];
  top_products: TopProduct[];
}
