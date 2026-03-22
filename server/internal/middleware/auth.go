package middleware

import (
	"errors"
	"go-crud/pkg/response"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// This file contains the authentication middleware for the application.
var jwtSecret = []byte("your_secret_key")

type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	jwt.RegisteredClaims
}

func GenerateToken(userID int64, email string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "Go-CRUD",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func parseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		claims, err := extractClaims(c)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, err.Error())
			c.Abort()
			return
		}

		c.Set(ContextUserID, claims.UserID)
		c.Set(ContextEmail, claims.Email)
		c.Next()
	}
}

func OptionalAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		if claims, err := extractClaims(c); err == nil {
			c.Set(ContextUserID, claims.UserID)
			c.Set(ContextEmail, claims.Email)
		}
		c.Next()
	}
}

func extractClaims(c *gin.Context) (*Claims, error) {
	// 1. Try httpOnly cookie first
	if tokenStr, err := c.Cookie("token"); err == nil && tokenStr != "" {
		return parseToken(tokenStr)
	}

	// 2. Fallback to Authorization header (API clients, mobile, etc.)
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return nil, errors.New("authorization required")
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return nil, errors.New("format must be: Bearer <token>")
	}

	return parseToken(parts[1])
}

func GetUserID(c *gin.Context) (int64, bool) {
	val, exists := c.Get(ContextUserID)
	if !exists {
		return 0, false
	}
	id, ok := val.(int64)
	return id, ok
}
