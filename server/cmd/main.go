package main

import (
	"go-crud/internal/config"
	"go-crud/internal/database"
	appconfig "go-crud/internal/domain/config"
	"go-crud/internal/logger"
	"go-crud/internal/middleware"
	"go-crud/internal/router"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1 Initialize logger
	logger.Init()

	// 2 Load config
	cfg := config.Load()
	logger.Log.Info("Config loaded",
		"port", cfg.AppPort,
	)

	// 3 Connect to database
	db := database.InitDB(cfg.DB)
	defer func() {
		db.Close()
		logger.Log.Info("Database connection closed")
	}()

	logger.Log.Info("Database connected")

	// Sync live USD→VND exchange rate into app_config on startup
	appconfig.SyncExchangeRate(db)
	// Schedule daily re-sync (retry once on failure)
	appconfig.StartDailySync(db)

	// 4 Setup router
	r := gin.New()

	// Middleware logger + recovery
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// Setup routes
	router.SetupUserRoutes(r, db)

	// 5 Start server
	logger.Log.Info("Server starting",
		"port", cfg.AppPort,
	)

	if err := r.Run(":" + cfg.AppPort); err != nil {
		logger.Log.Error("Server failed to start",
			"error", err.Error(),
		)
		os.Exit(1)
	}
}
