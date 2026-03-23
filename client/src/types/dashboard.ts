export interface DashboardSummary {
  total_products: number;
  total_stock_units: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock: number;
  imports_this_month: number;
  exports_this_month: number;
  import_value_month: number;
  export_value_month: number;
}

export interface SalesSummary {
  today_orders: number;
  today_revenue: number;
  week_orders: number;
  week_revenue: number;
  month_orders: number;
  month_revenue: number;
  pending_orders: number;
  packing_orders: number;
  delivering_orders: number;
  completed_orders: number;
  cancelled_orders: number;
}

export interface DailyPoint {
  date: string;
  import_qty: number;
  export_qty: number;
  import_amount: number;
  export_amount: number;
}

export interface DailySalesPoint {
  date: string;
  order_count: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  stock: number;
  value: number;
}

export interface DashboardData {
  summary: DashboardSummary;
  sales: SalesSummary;
  daily_activity: DailyPoint[];
  daily_sales: DailySalesPoint[];
  top_products: TopProduct[];
}
