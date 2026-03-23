package config

import (
	"net/http"
	"strconv"

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

func (h *Handler) RegisterRoutes(r *gin.RouterGroup) {
	r.GET("/config/exchange-rate", h.GetExchangeRate)
	r.PUT("/config/exchange-rate", middleware.Auth(), h.UpdateExchangeRate)
}

type ExchangeRateResponse struct {
	USDToVND float64 `json:"usd_to_vnd_rate"`
}

// GetExchangeRate returns current 1 USD = ? VND rate (public, no auth required)
func (h *Handler) GetExchangeRate(c *gin.Context) {
	ctx := c.Request.Context()

	var val string
	err := h.db.QueryRowContext(ctx,
		`SELECT config_value FROM app_config WHERE config_key = 'usd_to_vnd_rate'`,
	).Scan(&val)
	if err != nil {
		// Return sensible default if table not yet migrated
		response.Success(c, http.StatusOK, ExchangeRateResponse{USDToVND: 25500})
		return
	}

	rate, err := strconv.ParseFloat(val, 64)
	if err != nil || rate <= 0 {
		rate = 25500
	}

	response.Success(c, http.StatusOK, ExchangeRateResponse{USDToVND: rate})
}

type UpdateRateRequest struct {
	Rate float64 `json:"usd_to_vnd_rate" binding:"required,gt=0"`
}

// UpdateExchangeRate updates the exchange rate (admin only)
func (h *Handler) UpdateExchangeRate(c *gin.Context) {
	ctx := c.Request.Context()

	var req UpdateRateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "invalid request: "+err.Error())
		return
	}

	_, err := h.db.ExecContext(ctx, `
		IF EXISTS (SELECT 1 FROM app_config WHERE config_key = 'usd_to_vnd_rate')
			UPDATE app_config SET config_value = @p1, updated_at = GETDATE()
			WHERE config_key = 'usd_to_vnd_rate'
		ELSE
			INSERT INTO app_config (config_key, config_value, description)
			VALUES ('usd_to_vnd_rate', @p1, '1 USD = ? VND')
	`, strconv.FormatFloat(req.Rate, 'f', 2, 64))
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "failed to update rate: "+err.Error())
		return
	}

	response.Success(c, http.StatusOK, ExchangeRateResponse{USDToVND: req.Rate})
}
