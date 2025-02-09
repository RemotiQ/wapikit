package database

import (
	"database/sql"

	_ "github.com/go-jet/jet/v2"
	_ "github.com/lib/pq"
)

var DatabaseConnection *sql.DB

func GetDbInstance(dbUrl string) *sql.DB {
	if DatabaseConnection != nil {
		return DatabaseConnection
	}
	dsn := dbUrl
	var err error
	DatabaseConnection, err = sql.Open("postgres", dsn)
	if err != nil {
		panic(err)
	}
	return DatabaseConnection
}
