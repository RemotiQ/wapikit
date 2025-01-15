//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package model

import "errors"

type AiChatVisibilityEnum string

const (
	AiChatVisibilityEnum_Public  AiChatVisibilityEnum = "Public"
	AiChatVisibilityEnum_Private AiChatVisibilityEnum = "Private"
)

func (e *AiChatVisibilityEnum) Scan(value interface{}) error {
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
	case "Public":
		*e = AiChatVisibilityEnum_Public
	case "Private":
		*e = AiChatVisibilityEnum_Private
	default:
		return errors.New("jet: Invalid scan value '" + enumValue + "' for AiChatVisibilityEnum enum")
	}

	return nil
}

func (e AiChatVisibilityEnum) String() string {
	return string(e)
}
