package database

import (
	"database/sql"
	"fmt"
	"log"
	"sync"
	"time"

	_ "github.com/go-jet/jet/v2"
	_ "github.com/lib/pq"
)

var (
	DatabaseConnection *sql.DB
	once               sync.Once
)

func GetDbInstance(dbUrl string) *sql.DB {
	once.Do(func() {
		fmt.Println("Initializing Database Connection...")
		var err error
		DatabaseConnection, err = sql.Open("postgres", dbUrl)
		if err != nil {
			panic(err)
		}

		DatabaseConnection.SetMaxOpenConns(50)
		DatabaseConnection.SetMaxIdleConns(20)
		DatabaseConnection.SetConnMaxLifetime(30 * time.Minute)
		DatabaseConnection.SetConnMaxIdleTime(5 * time.Minute)

		err = DatabaseConnection.Ping()
		if err != nil {
			log.Fatalf("Failed to ping database: %v", err)
		}

		fmt.Println("Database Connection Successful")
	})

	return DatabaseConnection
}
