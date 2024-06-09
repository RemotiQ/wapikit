//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package table

import (
	"github.com/go-jet/jet/v2/postgres"
)

var OrganisationMember = newOrganisationMemberTable("public", "OrganisationMember", "")

type organisationMemberTable struct {
	postgres.Table

	// Columns
	UniqueId       postgres.ColumnString
	CreatedAt      postgres.ColumnTimestamp
	UpdatedAt      postgres.ColumnTimestamp
	Role           postgres.ColumnString
	Name           postgres.ColumnString
	Email          postgres.ColumnString
	PhoneNumber    postgres.ColumnString
	Username       postgres.ColumnString
	Password       postgres.ColumnString
	OrganisationId postgres.ColumnString

	AllColumns     postgres.ColumnList
	MutableColumns postgres.ColumnList
}

type OrganisationMemberTable struct {
	organisationMemberTable

	EXCLUDED organisationMemberTable
}

// AS creates new OrganisationMemberTable with assigned alias
func (a OrganisationMemberTable) AS(alias string) *OrganisationMemberTable {
	return newOrganisationMemberTable(a.SchemaName(), a.TableName(), alias)
}

// Schema creates new OrganisationMemberTable with assigned schema name
func (a OrganisationMemberTable) FromSchema(schemaName string) *OrganisationMemberTable {
	return newOrganisationMemberTable(schemaName, a.TableName(), a.Alias())
}

// WithPrefix creates new OrganisationMemberTable with assigned table prefix
func (a OrganisationMemberTable) WithPrefix(prefix string) *OrganisationMemberTable {
	return newOrganisationMemberTable(a.SchemaName(), prefix+a.TableName(), a.TableName())
}

// WithSuffix creates new OrganisationMemberTable with assigned table suffix
func (a OrganisationMemberTable) WithSuffix(suffix string) *OrganisationMemberTable {
	return newOrganisationMemberTable(a.SchemaName(), a.TableName()+suffix, a.TableName())
}

func newOrganisationMemberTable(schemaName, tableName, alias string) *OrganisationMemberTable {
	return &OrganisationMemberTable{
		organisationMemberTable: newOrganisationMemberTableImpl(schemaName, tableName, alias),
		EXCLUDED:                newOrganisationMemberTableImpl("", "excluded", ""),
	}
}

func newOrganisationMemberTableImpl(schemaName, tableName, alias string) organisationMemberTable {
	var (
		UniqueIdColumn       = postgres.StringColumn("UniqueId")
		CreatedAtColumn      = postgres.TimestampColumn("CreatedAt")
		UpdatedAtColumn      = postgres.TimestampColumn("UpdatedAt")
		RoleColumn           = postgres.StringColumn("Role")
		NameColumn           = postgres.StringColumn("Name")
		EmailColumn          = postgres.StringColumn("Email")
		PhoneNumberColumn    = postgres.StringColumn("PhoneNumber")
		UsernameColumn       = postgres.StringColumn("Username")
		PasswordColumn       = postgres.StringColumn("Password")
		OrganisationIdColumn = postgres.StringColumn("OrganisationId")
		allColumns           = postgres.ColumnList{UniqueIdColumn, CreatedAtColumn, UpdatedAtColumn, RoleColumn, NameColumn, EmailColumn, PhoneNumberColumn, UsernameColumn, PasswordColumn, OrganisationIdColumn}
		mutableColumns       = postgres.ColumnList{CreatedAtColumn, UpdatedAtColumn, RoleColumn, NameColumn, EmailColumn, PhoneNumberColumn, UsernameColumn, PasswordColumn, OrganisationIdColumn}
	)

	return organisationMemberTable{
		Table: postgres.NewTable(schemaName, tableName, alias, allColumns...),

		//Columns
		UniqueId:       UniqueIdColumn,
		CreatedAt:      CreatedAtColumn,
		UpdatedAt:      UpdatedAtColumn,
		Role:           RoleColumn,
		Name:           NameColumn,
		Email:          EmailColumn,
		PhoneNumber:    PhoneNumberColumn,
		Username:       UsernameColumn,
		Password:       PasswordColumn,
		OrganisationId: OrganisationIdColumn,

		AllColumns:     allColumns,
		MutableColumns: mutableColumns,
	}
}
