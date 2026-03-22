package middleware

import (
	"go-crud/internal/logger"
	"time"

	"github.com/gin-gonic/gin"
)

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Before request
		start := time.Now()

		c.Next()

		// After request
		latency := time.Since(start)

		// Log the request details
		logger.Log.Info("HTTP Request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"latency", latency.String(),
			"client_ip", c.ClientIP(),
		)
	}
}
