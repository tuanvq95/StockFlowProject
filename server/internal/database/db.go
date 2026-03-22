package database

import (
	"log"
	"time"

	"github.com/jmoiron/sqlx"
	_ "github.com/microsoft/go-mssqldb"

	"go-crud/internal/config"
)

func InitDB(cft config.DBConfig) *sqlx.DB {
	db, err := sqlx.Open("sqlserver", cft.DSN())
	if err != nil {
		log.Fatalf("? Failed to open DB: %v", err)
	}

	// Configure connection pool settings
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(10)
	db.SetConnMaxLifetime(5 * time.Minute)
	db.SetConnMaxIdleTime(2 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Fatalf("? Failed to connect to SQL Server: %v", err)
	}

	log.Println("? Connected to SQL Server successfully")
	return db
}
