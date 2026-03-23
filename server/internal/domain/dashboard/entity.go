package dashboard

type Summary struct {
	TotalProducts    int64   `json:"total_products"`
	TotalStockUnits  int64   `json:"total_stock_units"`
	TotalStockValue  float64 `json:"total_stock_value"`
	LowStockCount    int64   `json:"low_stock_count"`
	ImportsThisMonth int64   `json:"imports_this_month"`
	ExportsThisMonth int64   `json:"exports_this_month"`
}

type DailyPoint struct {
	Date         string  `json:"date"`
	ImportQty    int64   `json:"import_qty"`
	ExportQty    int64   `json:"export_qty"`
	ImportAmount float64 `json:"import_amount"`
	ExportAmount float64 `json:"export_amount"`
}

type TopProduct struct {
	Name  string  `db:"name"  json:"name"`
	Stock int     `db:"stock" json:"stock"`
	Value float64 `db:"value" json:"value"`
}

type DashboardData struct {
	Summary       Summary      `json:"summary"`
	DailyActivity []DailyPoint `json:"daily_activity"`
	TopProducts   []TopProduct `json:"top_products"`
}
