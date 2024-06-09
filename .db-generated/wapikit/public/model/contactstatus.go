//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package model

import "errors"

type ContactStatus string

const (
	ContactStatus_Active   ContactStatus = "active"
	ContactStatus_Inactive ContactStatus = "inactive"
)

func (e *ContactStatus) Scan(value interface{}) error {
	var enumValue string
	switch val := value.(type) {
	case string:
		enumValue = val
	case []byte:
		enumValue = string(val)
	default:
		return errors.New("jet: Invalid scan value for AllTypesEnum enum. Enum value has to be of type string or []byte")
	}

	switch enumValue {
	case "active":
		*e = ContactStatus_Active
	case "inactive":
		*e = ContactStatus_Inactive
	default:
		return errors.New("jet: Invalid scan value '" + enumValue + "' for ContactStatus enum")
	}

	return nil
}

func (e ContactStatus) String() string {
	return string(e)
}
