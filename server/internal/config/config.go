package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort   string
	AppEnv    string
	JWTSecret string
	DB        DBConfig
}

type DBConfig struct {
	Host      string
	Port      string
	User      string
	Password  string
	Name      string
	Encrypt   string
	TrustCert string
}

// DSN returns the Data Source Name for connecting to the database
func (d DBConfig) DSN() string {
	return fmt.Sprintf(
		"sqlserver://%s:%s@%s:%s?database=%s&encrypt=%s&TrustServerCertificate=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.Encrypt, d.TrustCert,
	)
}

// Load reads the environment variables and returns a Config struct
func Load() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system env")
	}

	return &Config{
		AppPort:   getEnv("APP_PORT", "8080"),
		AppEnv:    getEnv("APP_ENV", "demo-go-lang"),
		JWTSecret: getEnv("JWT_SECRET", "your_secret_key"),
		DB: DBConfig{
			Host:      getEnv("DB_HOST", "localhost"),
			Port:      getEnv("DB_PORT", "1433"),
			User:      getEnv("DB_USER", "sa"),
			Password:  getEnv("DB_PASSWORD", ""),
			Name:      getEnv("DB_NAME", "myapp_db"),
			Encrypt:   getEnv("DB_ENCRYPT", "disable"),
			TrustCert: getEnv("DB_TRUST_CERT", "true"),
		},
	}
}

// getEnv retrieves the value of the environment variable named by the key.
// If the variable is empty or not present, it returns the fallback value.
func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
