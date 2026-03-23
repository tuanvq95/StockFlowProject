package dashboard

type Summary struct {
	TotalProducts    int64   `json:"total_products"`
	TotalStockUnits  int64   `json:"total_stock_units"`
	TotalStockValue  float64 `json:"total_stock_value"`
	LowStockCount    int64   `json:"low_stock_count"`
	OutOfStock       int64   `json:"out_of_stock"`
	ImportsThisMonth int64   `json:"imports_this_month"`
	ExportsThisMonth int64   `json:"exports_this_month"`
	ImportValueMonth float64 `json:"import_value_month"`
	ExportValueMonth float64 `json:"export_value_month"`
}

type SalesSummary struct {
	TodayOrders      int64   `json:"today_orders"`
	TodayRevenue     float64 `json:"today_revenue"`
	WeekOrders       int64   `json:"week_orders"`
	WeekRevenue      float64 `json:"week_revenue"`
	MonthOrders      int64   `json:"month_orders"`
	MonthRevenue     float64 `json:"month_revenue"`
	PendingOrders    int64   `json:"pending_orders"`
	PackingOrders    int64   `json:"packing_orders"`
	DeliveringOrders int64   `json:"delivering_orders"`
	CompletedOrders  int64   `json:"completed_orders"`
	CancelledOrders  int64   `json:"cancelled_orders"`
}

type DailyPoint struct {
	Date         string  `json:"date"`
	ImportQty    int64   `json:"import_qty"`
	ExportQty    int64   `json:"export_qty"`
	ImportAmount float64 `json:"import_amount"`
	ExportAmount float64 `json:"export_amount"`
}

type DailySalesPoint struct {
	Date       string  `json:"date"`
	OrderCount int64   `json:"order_count"`
	Revenue    float64 `json:"revenue"`
}

type TopProduct struct {
	Name  string  `db:"name"  json:"name"`
	Stock int     `db:"stock" json:"stock"`
	Value float64 `db:"value" json:"value"`
}

type DashboardData struct {
	Summary       Summary           `json:"summary"`
	Sales         SalesSummary      `json:"sales"`
	DailyActivity []DailyPoint      `json:"daily_activity"`
	DailySales    []DailySalesPoint `json:"daily_sales"`
	TopProducts   []TopProduct      `json:"top_products"`
}
