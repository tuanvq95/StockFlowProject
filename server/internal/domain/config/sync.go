package config

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"go-crud/internal/logger"

	"github.com/jmoiron/sqlx"
)

// exchangeRateAPIResponse matches open.er-api.com/v6/latest/USD
type exchangeRateAPIResponse struct {
	Result string             `json:"result"`
	Rates  map[string]float64 `json:"rates"`
}

// syncOnce makes one attempt to fetch the live rate and upsert it into the DB.
func syncOnce(db *sqlx.DB) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	rate, err := fetchLiveRate(ctx)
	if err != nil {
		return fmt.Errorf("fetch: %w", err)
	}

	_, err = db.ExecContext(ctx, `
		IF EXISTS (SELECT 1 FROM app_config WHERE config_key = 'usd_to_vnd_rate')
			UPDATE app_config SET config_value = @p1, updated_at = GETDATE()
			WHERE config_key = 'usd_to_vnd_rate'
		ELSE
			INSERT INTO app_config (config_key, config_value, description)
			VALUES ('usd_to_vnd_rate', @p1, '1 USD = ? VND')
	`, strconv.FormatFloat(rate, 'f', 2, 64))
	if err != nil {
		return fmt.Errorf("db upsert: %w", err)
	}

	logger.Log.Info("Exchange rate synced from open.er-api.com",
		"usd_to_vnd", fmt.Sprintf("%.2f", rate),
	)
	return nil
}

// syncWithRetry tries once; on failure waits 5 minutes and retries once more.
// If the retry also fails the old DB value is kept.
func syncWithRetry(db *sqlx.DB) {
	if err := syncOnce(db); err == nil {
		return
	} else {
		logger.Log.Warn("Exchange rate sync failed, retrying in 5 minutes",
			"error", err.Error(),
		)
	}

	time.Sleep(5 * time.Minute)

	if err := syncOnce(db); err != nil {
		logger.Log.Warn("Exchange rate sync retry failed, keeping existing rate",
			"error", err.Error(),
		)
	}
}

// SyncExchangeRate performs a single sync attempt at startup (non-blocking intent).
// Errors are logged but do not stop the server.
func SyncExchangeRate(db *sqlx.DB) {
	if err := syncOnce(db); err != nil {
		logger.Log.Warn("Startup exchange rate sync failed, keeping existing rate",
			"error", err.Error(),
		)
	}
}

// StartDailySync spawns a background goroutine that calls syncWithRetry every 24 hours.
func StartDailySync(db *sqlx.DB) {
	go func() {
		ticker := time.NewTicker(24 * time.Hour)
		defer ticker.Stop()
		logger.Log.Info("Daily exchange rate sync scheduled (every 24h, retry once on failure)")
		for range ticker.C {
			logger.Log.Info("Running scheduled daily exchange rate sync")
			syncWithRetry(db)
		}
	}()
}

func fetchLiveRate(ctx context.Context) (float64, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://open.er-api.com/v6/latest/USD", nil)
	if err != nil {
		return 0, err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("exchange rate API returned status %d", resp.StatusCode)
	}

	var result exchangeRateAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, fmt.Errorf("failed to decode exchange rate response: %w", err)
	}

	if result.Result != "success" {
		return 0, fmt.Errorf("exchange rate API result: %s", result.Result)
	}

	rate, ok := result.Rates["VND"]
	if !ok || rate <= 0 {
		return 0, fmt.Errorf("VND rate not found in response")
	}

	return rate, nil
}

