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

var Tag = newTagTable("public", "Tag", "")

type tagTable struct {
	postgres.Table

	// Columns
	UniqueId  postgres.ColumnString
	CreatedAt postgres.ColumnTimestamp
	UpdatedAt postgres.ColumnTimestamp

	AllColumns     postgres.ColumnList
	MutableColumns postgres.ColumnList
}

type TagTable struct {
	tagTable

	EXCLUDED tagTable
}

// AS creates new TagTable with assigned alias
func (a TagTable) AS(alias string) *TagTable {
	return newTagTable(a.SchemaName(), a.TableName(), alias)
}

// Schema creates new TagTable with assigned schema name
func (a TagTable) FromSchema(schemaName string) *TagTable {
	return newTagTable(schemaName, a.TableName(), a.Alias())
}

// WithPrefix creates new TagTable with assigned table prefix
func (a TagTable) WithPrefix(prefix string) *TagTable {
	return newTagTable(a.SchemaName(), prefix+a.TableName(), a.TableName())
}

// WithSuffix creates new TagTable with assigned table suffix
func (a TagTable) WithSuffix(suffix string) *TagTable {
	return newTagTable(a.SchemaName(), a.TableName()+suffix, a.TableName())
}

func newTagTable(schemaName, tableName, alias string) *TagTable {
	return &TagTable{
		tagTable: newTagTableImpl(schemaName, tableName, alias),
		EXCLUDED: newTagTableImpl("", "excluded", ""),
	}
}

func newTagTableImpl(schemaName, tableName, alias string) tagTable {
	var (
		UniqueIdColumn  = postgres.StringColumn("UniqueId")
		CreatedAtColumn = postgres.TimestampColumn("CreatedAt")
		UpdatedAtColumn = postgres.TimestampColumn("UpdatedAt")
		allColumns      = postgres.ColumnList{UniqueIdColumn, CreatedAtColumn, UpdatedAtColumn}
		mutableColumns  = postgres.ColumnList{CreatedAtColumn, UpdatedAtColumn}
	)

	return tagTable{
		Table: postgres.NewTable(schemaName, tableName, alias, allColumns...),

		//Columns
		UniqueId:  UniqueIdColumn,
		CreatedAt: CreatedAtColumn,
		UpdatedAt: UpdatedAtColumn,

		AllColumns:     allColumns,
		MutableColumns: mutableColumns,
	}
}
