package dashboard

import (
	"net/http"
	"time"

	"go-crud/internal/middleware"
	"go-crud/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

type Handler struct {
	db *sqlx.DB
}

func NewHandler(db *sqlx.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) RegisterRoutes(rg *gin.RouterGroup) {
	dash := rg.Group("/dashboard")
	dash.Use(middleware.Auth())
	dash.GET("", h.Get)
}

func (h *Handler) Get(c *gin.Context) {
	ctx := c.Request.Context()

	// ── 1. Inventory + warehouse summary ───────────────────────────────
	var summary Summary
	err := h.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*)                                                    FROM products)                 AS total_products,
			(SELECT ISNULL(CAST(SUM(stock) AS BIGINT), 0)                     FROM products)                 AS total_stock_units,
			(SELECT ISNULL(SUM(CAST(stock AS DECIMAL(18,2)) * price), 0.0)    FROM products)                 AS total_stock_value,
			(SELECT COUNT(*)                                                    FROM products WHERE stock < 10) AS low_stock_count,
			(SELECT COUNT(*)                                                    FROM products WHERE stock = 0)  AS out_of_stock,
			(SELECT COUNT(*) FROM stock_transactions
			 WHERE type = 'IMPORT'
			   AND YEAR(created_at)  = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE()))                                                       AS imports_this_month,
			(SELECT COUNT(*) FROM stock_transactions
			 WHERE type = 'EXPORT'
			   AND YEAR(created_at)  = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE()))                                                       AS exports_this_month,
			(SELECT ISNULL(SUM(CAST(i.quantity AS DECIMAL(18,2)) * i.unit_price), 0)
			 FROM stock_transactions t
			 JOIN stock_transaction_items i ON i.transaction_id = t.id
			 WHERE t.type = 'IMPORT'
			   AND YEAR(t.created_at)  = YEAR(GETDATE())
			   AND MONTH(t.created_at) = MONTH(GETDATE()))                                                     AS import_value_month,
			(SELECT ISNULL(SUM(CAST(i.quantity AS DECIMAL(18,2)) * i.unit_price), 0)
			 FROM stock_transactions t
			 JOIN stock_transaction_items i ON i.transaction_id = t.id
			 WHERE t.type = 'EXPORT'
			   AND YEAR(t.created_at)  = YEAR(GETDATE())
			   AND MONTH(t.created_at) = MONTH(GETDATE()))                                                     AS export_value_month
	`).Scan(
		&summary.TotalProducts, &summary.TotalStockUnits, &summary.TotalStockValue,
		&summary.LowStockCount, &summary.OutOfStock,
		&summary.ImportsThisMonth, &summary.ExportsThisMonth,
		&summary.ImportValueMonth, &summary.ExportValueMonth,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "summary query failed: "+err.Error())
		return
	}

	// ── 2. Sales summary (graceful  Eorders table may not exist yet) ────
	var sales SalesSummary
	_ = h.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*) FROM orders
			 WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
			   AND status NOT IN ('CANCELLED')) AS today_orders,
			(SELECT ISNULL(SUM(total_amount), 0) FROM orders
			 WHERE CAST(created_at AS DATE) = CAST(GETDATE() AS DATE)
			   AND status NOT IN ('CANCELLED')) AS today_revenue,
			(SELECT COUNT(*) FROM orders
			 WHERE created_at >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
			   AND status NOT IN ('CANCELLED')) AS week_orders,
			(SELECT ISNULL(SUM(total_amount), 0) FROM orders
			 WHERE created_at >= DATEADD(DAY, -6, CAST(GETDATE() AS DATE))
			   AND status NOT IN ('CANCELLED')) AS week_revenue,
			(SELECT COUNT(*) FROM orders
			 WHERE YEAR(created_at)  = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE())
			   AND status NOT IN ('CANCELLED')) AS month_orders,
			(SELECT ISNULL(SUM(total_amount), 0) FROM orders
			 WHERE YEAR(created_at)  = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE())
			   AND status NOT IN ('CANCELLED')) AS month_revenue,
			(SELECT COUNT(*) FROM orders WHERE status = 'PENDING')    AS pending_orders,
			(SELECT COUNT(*) FROM orders WHERE status = 'PACKING')    AS packing_orders,
			(SELECT COUNT(*) FROM orders WHERE status = 'DELIVERING') AS delivering_orders,
			(SELECT COUNT(*) FROM orders WHERE status = 'COMPLETED')  AS completed_orders,
			(SELECT COUNT(*) FROM orders WHERE status = 'CANCELLED')  AS cancelled_orders
	`).Scan(
		&sales.TodayOrders, &sales.TodayRevenue,
		&sales.WeekOrders, &sales.WeekRevenue,
		&sales.MonthOrders, &sales.MonthRevenue,
		&sales.PendingOrders, &sales.PackingOrders, &sales.DeliveringOrders,
		&sales.CompletedOrders, &sales.CancelledOrders,
	)

	// ── 3. Daily warehouse activity  Elast 30 days ──────────────────────
	type dailyRow struct {
		TxDate      time.Time `db:"tx_date"`
		Type        string    `db:"type"`
		TotalQty    int64     `db:"total_qty"`
		TotalAmount float64   `db:"total_amount"`
	}
	var rawRows []dailyRow
	err = h.db.SelectContext(ctx, &rawRows, `
		SELECT
			CAST(t.created_at AS DATE)                                               AS tx_date,
			t.type,
			ISNULL(SUM(i.quantity), 0)                                               AS total_qty,
			ISNULL(SUM(CAST(i.quantity AS DECIMAL(18,2)) * i.unit_price), 0.0)       AS total_amount
		FROM stock_transactions t
		LEFT JOIN stock_transaction_items i ON i.transaction_id = t.id
		WHERE t.created_at >= DATEADD(DAY, -29, CAST(GETDATE() AS DATE))
		GROUP BY CAST(t.created_at AS DATE), t.type
		ORDER BY tx_date
	`)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "daily activity query failed: "+err.Error())
		return
	}

	dateMap := map[string]*DailyPoint{}
	for _, row := range rawRows {
		d := row.TxDate.Format("2006-01-02")
		if _, ok := dateMap[d]; !ok {
			dateMap[d] = &DailyPoint{Date: d}
		}
		if row.Type == "IMPORT" {
			dateMap[d].ImportQty += row.TotalQty
			dateMap[d].ImportAmount += row.TotalAmount
		} else {
			dateMap[d].ExportQty += row.TotalQty
			dateMap[d].ExportAmount += row.TotalAmount
		}
	}

	now := time.Now()
	dailyActivity := make([]DailyPoint, 0, 30)
	for i := 29; i >= 0; i-- {
		d := now.AddDate(0, 0, -i).Format("2006-01-02")
		if pt, ok := dateMap[d]; ok {
			dailyActivity = append(dailyActivity, *pt)
		} else {
			dailyActivity = append(dailyActivity, DailyPoint{Date: d})
		}
	}

	// ── 4. Daily sales  Elast 30 days (graceful) ────────────────────────
	type dailySalesRow struct {
		SaleDate   time.Time `db:"sale_date"`
		OrderCount int64     `db:"order_count"`
		Revenue    float64   `db:"revenue"`
	}
	var salesRows []dailySalesRow
	_ = h.db.SelectContext(ctx, &salesRows, `
		SELECT
			CAST(created_at AS DATE)           AS sale_date,
			COUNT(*)                           AS order_count,
			ISNULL(SUM(total_amount), 0)       AS revenue
		FROM orders
		WHERE created_at >= DATEADD(DAY, -29, CAST(GETDATE() AS DATE))
		  AND status != 'CANCELLED'
		GROUP BY CAST(created_at AS DATE)
		ORDER BY sale_date
	`)

	salesDateMap := map[string]*DailySalesPoint{}
	for _, row := range salesRows {
		d := row.SaleDate.Format("2006-01-02")
		salesDateMap[d] = &DailySalesPoint{
			Date:       d,
			OrderCount: row.OrderCount,
			Revenue:    row.Revenue,
		}
	}
	dailySales := make([]DailySalesPoint, 0, 30)
	for i := 29; i >= 0; i-- {
		d := now.AddDate(0, 0, -i).Format("2006-01-02")
		if pt, ok := salesDateMap[d]; ok {
			dailySales = append(dailySales, *pt)
		} else {
			dailySales = append(dailySales, DailySalesPoint{Date: d})
		}
	}

	// ── 5. Top 8 products by stock ──────────────────────────────────────
	topProducts := make([]TopProduct, 0)
	err = h.db.SelectContext(ctx, &topProducts, `
		SELECT TOP 8
			name,
			stock,
			CAST(CAST(stock AS DECIMAL(18,2)) * price AS DECIMAL(18,2)) AS value
		FROM products
		ORDER BY stock DESC
	`)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "top products query failed: "+err.Error())
		return
	}

	response.Success(c, http.StatusOK, DashboardData{
		Summary:       summary,
		Sales:         sales,
		DailyActivity: dailyActivity,
		DailySales:    dailySales,
		TopProducts:   topProducts,
	})
}
