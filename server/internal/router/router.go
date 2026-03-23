package router

import (
	"go-crud/internal/domain/auth"
	appconfig "go-crud/internal/domain/config"
	"go-crud/internal/domain/dashboard"
	"go-crud/internal/domain/order"
	"go-crud/internal/domain/product"
	"go-crud/internal/domain/user"
	"go-crud/internal/domain/warehouse"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

func SetupUserRoutes(r *gin.Engine, db *sqlx.DB) *gin.Engine {
	api := r.Group("/api/v1")

	// Auth domain
	authRepo := auth.NewRepository(db)
	authSvc := auth.NewService(authRepo)
	authHandler := auth.NewHandler(authSvc)
	authHandler.RegisterRoutes(api)

	// User domain
	userRepo := user.NewRepository(db)
	userSvc := user.NewService(userRepo)
	userHandler := user.NewHandler(userSvc)
	userHandler.RegisterRoutes(api)

	// Product domain
	productRepo := product.NewRepository(db)
	productSvc := product.NewService(productRepo)
	productHandler := product.NewHandler(productSvc)
	productHandler.RegisterRoutes(api)

	// Warehouse domain
	warehouseRepo := warehouse.NewRepository(db)
	warehouseSvc := warehouse.NewService(warehouseRepo)
	warehouseHandler := warehouse.NewHandler(warehouseSvc)
	warehouseHandler.RegisterRoutes(api)

	// Dashboard
	dashboardHandler := dashboard.NewHandler(db)
	dashboardHandler.RegisterRoutes(api)

	// Order domain
	orderRepo := order.NewRepository(db)
	orderSvc := order.NewService(orderRepo)
	orderHandler := order.NewHandler(orderSvc)
	orderHandler.RegisterRoutes(api)

	// App config (exchange rate, etc.)
	configHandler := appconfig.NewHandler(db)
	configHandler.RegisterRoutes(api)

	return r
}
