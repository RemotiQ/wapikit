//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package model

import "errors"

type MessageDirection string

const (
	MessageDirection_Inbound  MessageDirection = "inbound"
	MessageDirection_Outbound MessageDirection = "outbound"
)

func (e *MessageDirection) Scan(value interface{}) error {
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
	case "inbound":
		*e = MessageDirection_Inbound
	case "outbound":
		*e = MessageDirection_Outbound
	default:
		return errors.New("jet: Invalid scan value '" + enumValue + "' for MessageDirection enum")
	}

	return nil
}

func (e MessageDirection) String() string {
	return string(e)
}
