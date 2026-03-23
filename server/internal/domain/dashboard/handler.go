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

	// -- Summary stats ---------------------------------------------------
	var summary Summary
	err := h.db.QueryRowContext(ctx, `
		SELECT
			(SELECT COUNT(*)                                                  FROM products)               AS total_products,
			(SELECT ISNULL(CAST(SUM(stock) AS BIGINT), 0)                   FROM products)               AS total_stock_units,
			(SELECT ISNULL(SUM(CAST(stock AS DECIMAL(18,2)) * price), 0.0)  FROM products)               AS total_stock_value,
			(SELECT COUNT(*)                                                  FROM products WHERE stock < 10) AS low_stock_count,
			(SELECT COUNT(*) FROM stock_transactions
			 WHERE type = 'IMPORT'
			   AND YEAR(created_at) = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE()))                                                   AS imports_this_month,
			(SELECT COUNT(*) FROM stock_transactions
			 WHERE type = 'EXPORT'
			   AND YEAR(created_at) = YEAR(GETDATE())
			   AND MONTH(created_at) = MONTH(GETDATE()))                                                   AS exports_this_month
	`).Scan(
		&summary.TotalProducts, &summary.TotalStockUnits, &summary.TotalStockValue,
		&summary.LowStockCount, &summary.ImportsThisMonth, &summary.ExportsThisMonth,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "summary query failed: "+err.Error())
		return
	}

	// -- Daily activity - last 30 days -----------------------------------
	type dailyRow struct {
		TxDate      time.Time `db:"tx_date"`
		Type        string    `db:"type"`
		TotalQty    int64     `db:"total_qty"`
		TotalAmount float64   `db:"total_amount"`
	}
	var rawRows []dailyRow
	err = h.db.SelectContext(ctx, &rawRows, `
		SELECT
			CAST(t.created_at AS DATE)                                                AS tx_date,
			t.type,
			ISNULL(SUM(i.quantity), 0)                                                AS total_qty,
			ISNULL(SUM(CAST(i.quantity AS DECIMAL(18,2)) * i.unit_price), 0.0)        AS total_amount
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

	// Aggregate rows into one point per date
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

	// Fill every day in the window (zero-fill if no transactions)
	dailyActivity := make([]DailyPoint, 0, 30)
	now := time.Now()
	for i := 29; i >= 0; i-- {
		d := now.AddDate(0, 0, -i).Format("2006-01-02")
		if pt, ok := dateMap[d]; ok {
			dailyActivity = append(dailyActivity, *pt)
		} else {
			dailyActivity = append(dailyActivity, DailyPoint{Date: d})
		}
	}

	// -- Top 8 products by stock -----------------------------------------
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
		DailyActivity: dailyActivity,
		TopProducts:   topProducts,
	})
}
