//
// Code generated by go-jet DO NOT EDIT.
//
// WARNING: Changes to this file may cause incorrect behavior
// and will be lost if the code is regenerated
//

package model

import "errors"

type PricingPlanValidityEnum string

const (
	PricingPlanValidityEnum_Monthly PricingPlanValidityEnum = "Monthly"
	PricingPlanValidityEnum_Yearly  PricingPlanValidityEnum = "Yearly"
)

func (e *PricingPlanValidityEnum) Scan(value interface{}) error {
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
	case "Monthly":
		*e = PricingPlanValidityEnum_Monthly
	case "Yearly":
		*e = PricingPlanValidityEnum_Yearly
	default:
		return errors.New("jet: Invalid scan value '" + enumValue + "' for PricingPlanValidityEnum enum")
	}

	return nil
}

func (e PricingPlanValidityEnum) String() string {
	return string(e)
}
